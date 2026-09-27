/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/reports/passed": ["./node_modules/@expo-google-fonts/sarabun/**/*.ttf"],
  },
};

export default nextConfig;
