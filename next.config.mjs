/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/workspace", destination: "/dashboard", permanent: true },
      { source: "/workspace/shared", destination: "/dashboard/shared", permanent: true },
      { source: "/workspace/recent", destination: "/dashboard/recent", permanent: true },
      { source: "/workspace/trash", destination: "/dashboard/trash", permanent: true },
      {
        source: "/workspace/folder/:folderId",
        destination: "/dashboard/folder/:folderId",
        permanent: true,
      },
      {
        source: "/workspace/dashboard/:dashboardId/edit",
        destination: "/dashboard/dashboard/:dashboardId/edit",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
