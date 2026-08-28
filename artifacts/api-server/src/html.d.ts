// esbuild bundles .html imports as text (see build.mjs `loader`).
declare module "*.html" {
  const content: string;
  export default content;
}
