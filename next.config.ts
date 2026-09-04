import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next regenerates AGENTS.md/CLAUDE.md on every `next dev` unless this is off.
  agentRules: false,
};

export default nextConfig;
