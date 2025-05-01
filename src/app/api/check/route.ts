import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import validator from 'validator';
import psl from 'psl';

const phishingWords = [
  'urgent',
  'verify your account',
  'suspended',
  'click here',
  'password',
  'unauthorized access',
  'login now',
  'account compromised',
];

const trustedBrands: Record<string, string[]> = {
  paypal: ['paypal.com', 'paypalobjects.com'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'outlook.com', 'live.com'],
  google: ['google.com', 'gmail.com', 'gstatic.com'],
  amazon: ['amazon.com'],
};

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

const extractUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s"]+/g;
  return text.match(urlRegex) || [];
};

const extractBaseDomain = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    const parsed = psl.parse(hostname);
    if ('domain' in parsed && parsed.domain) {
      return parsed.domain;
    }
    return hostname;
  } catch {
    return '';
  }
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await rateLimiter.consume(ip.toString());
  } catch {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const cleanMessage = validator.escape(message.trim());
  const matches = phishingWords.filter(word =>
    cleanMessage.toLowerCase().includes(word.toLowerCase())
  );

  const urls = extractUrls(cleanMessage);
  const baseDomains = urls.map(extractBaseDomain);

  const brandFlags: { brand: string; isSuspicious: boolean; matchedLinks: string[] }[] = [];

  for (const brand in trustedBrands) {
    const normalizedBrand = brand.toLowerCase();
    if (cleanMessage.toLowerCase().includes(normalizedBrand)) {
      const validDomains = trustedBrands[brand];
      const mismatches = baseDomains.filter(
        domain => domain && !validDomains.some(valid => domain === valid)
      );

      if (mismatches.length > 0) {
        brandFlags.push({
          brand,
          isSuspicious: true,
          matchedLinks: mismatches,
        });
      }
    }
  }

  const baseScore = matches.length / phishingWords.length;
  const brandPenalty = brandFlags.length > 0 ? 0.3 : 0;
  const score = Math.min(baseScore + brandPenalty, 1);
  const isPhishing = matches.length > 0 || brandFlags.length > 0;


  return NextResponse.json({
    isPhishing,
    matches,
    score,
    brandFlags,
  });
}
