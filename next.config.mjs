/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/reports/passed": ["./node_modules/@expo-google-fonts/sarabun/**/*.ttf"],
  },
};

export default nextConfig;
