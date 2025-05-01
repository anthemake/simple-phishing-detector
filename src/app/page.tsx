"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";


export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<
    null | {
      isPhishing: boolean;
      score: number;
      matches: string[];
      explanation: string;
      links: { text: string; href: string }[];
      brandFlags: { brand: string; isSuspicious: boolean; matchedLinks: string[] }[];
    }
  >(null);
  const [loading, setLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");

  useEffect(() => {
    if (!loading) {
      setLoadingDots("");
      return;
    }
    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 300);
    return () => clearInterval(interval);
  }, [loading]);

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      const checkRes = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const checkData = await checkRes.json();

      const aiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const aiData = await aiRes.json();

      const links = extractLinks(message);


      const finalScore = Math.min(
        (checkData.score || 0) + ((checkData.brandFlags?.length || 0) > 0 ? 0.3 : 0),
        1
      );

      const explanationLower = aiData.explanation.toLowerCase();
      const aiFlagsRisk = explanationLower.includes('phishing') || explanationLower.includes('suspicious');

      const isPhishing = aiFlagsRisk || finalScore >= 0.3;

      const resultData = {
        ...checkData,
        score: finalScore,
        explanation: aiData.explanation,
        links,
        brandFlags: checkData.brandFlags ?? [],
        isPhishing,
      };

      setResult(resultData);

      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, result: resultData }),
      });
    } catch (err) {
      console.error("Error analyzing message:", err);
    } finally {
      setLoading(false);
    }
  };

  const extractLinks = (text: string) => {
    const regex = /\[([^\]]+)\]\((https?:[^\)]+)\)/g;
    const rawUrls = /https?:\/\/[\w./?=#&%-]+/gi;
    const results: { text: string; href: string }[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      results.push({ text: match[1], href: match[2] });
    }
    const rawMatches = text.match(rawUrls);
    if (rawMatches) {
      rawMatches.forEach((url) => {
        if (!results.some((r) => r.href === url)) {
          results.push({ text: url, href: url });
        }
      });
    }
    return results;
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-4 py-12 flex flex-col items-center justify-center font-inter">
      <motion.h1
        className="text-4xl font-bold mb-10 text-sky-400 tracking-tight"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Simple Phishing Detector
      </motion.h1>

      <textarea
        className="w-full max-w-3xl h-40 p-4 text-white bg-gray-800 rounded-md resize-none placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400 text-base"
        placeholder="Paste suspicious email or message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="mt-6 flex gap-4">
        <button
          className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-md shadow-sm text-base min-w-[140px]"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading && !result ? `Analyzing${loadingDots}` : "Analyze Message"}

        </button>
        <button
          className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-md text-white text-base"
          onClick={() => {
            setMessage('');
            setResult(null);
            setLoading(false);
          }}
        >
          Reset
        </button>

      </div>

      {result && (
        <motion.div
          className="mt-10 w-full max-w-4xl bg-gray-900 p-6 rounded-xl shadow-lg text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-sky-300 mb-4 border-b border-gray-700 pb-2">
            📋 Report Summary
          </h2>

          <div className="space-y-3">
            <p><strong>Status:</strong> {result.isPhishing ? "⚠️ Likely Phishing" : "✅ Safe"}</p>
            <p><strong>Combined Score:</strong> {Math.round(result.score * 100)}%</p>
            <p><strong>Matched Keywords:</strong> {result.matches.join(", ") || "None"}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-base font-semibold text-sky-200 mb-1">🧠 AI Explanation</h3>
            <p className="text-white/90 whitespace-pre-line">{result.explanation}</p>
          </div>

          {result.links.length > 0 && (
            <div className="mt-5">
              <h3 className="text-base font-semibold text-sky-200 mb-1">🔗 Detected Links</h3>
              <ul className="list-disc pl-6 text-white/90">
                {result.links.map((link, i) => (
                  <li key={i} className="mb-1">
                    <span className="text-red-400 break-all">{link.href}</span>
                    <p className="text-xs text-gray-400">⚠️ Link shown for analysis only — do not click.</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.brandFlags ?? []).length > 0 && (
            <div className="mt-5">
              <h3 className="text-base font-semibold text-yellow-300 mb-1">🚩 Brand Mismatch Alerts</h3>
              <ul className="list-disc pl-6 text-white/90">
                {result.brandFlags.map((flag, i) => (
                  <li key={i} className="mb-2">
                    Mentions <strong>{flag.brand}</strong> but links to:
                    <ul className="pl-4">
                      {flag.matchedLinks.map((link, j) => (
                        <li key={j} className="text-red-400 break-all">{link}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-500 font-semibold mt-1">
                      ⚠️ Untrusted domain used. Possible impersonation.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </main>
  );
}
