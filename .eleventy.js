module.exports = function(eleventyConfig) {
  // Copy CSS, JS, and images
  eleventyConfig.addPassthroughCopy("css/");
  eleventyConfig.addPassthroughCopy("js/");
  eleventyConfig.addPassthroughCopy("*.md");

  // Collections
  eleventyConfig.addCollection("nav", () => [
    { href: "#testimonials", label: "Reviews" },
    { href: "#howitworks", label: "How It Works" },
    { href: "#locations", label: "Locations" },
    { href: "#quote", label: "Get Quote" }
  ]);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    pathPrefix: "/gold/",
    templateFormats: ["html", "md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
