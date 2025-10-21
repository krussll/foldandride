# Fold & Ride — Jekyll Starter

This is the root directory
A GitHub Pages–ready Jekyll site that previews the Fold & Ride digital nomad tools hub. The layout uses Tailwind CSS (via CDN) for a calm, dark UI and includes sample content so you can validate the publishing flow before wiring in live calculators.

## Local development

1. Install Ruby 3.1+ and Bundler.
2. Install dependencies:
   ```sh
   bundle install
   ```
3. Serve the site locally:
   ```sh
   bundle exec jekyll serve
   ```
4. Visit `http://127.0.0.1:4000` to explore the homepage, tools overview, guides listing, and sample post.

> **Note:** If RubyGems is unreachable from your environment, you can still review the generated HTML/CSS because the repo already contains all theme assets.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In the repository settings, enable **Pages** and choose the `work` branch with the `/` (root) folder.
3. GitHub Pages will run `jekyll build` automatically and serve the generated site at `https://<username>.github.io/<repo>/`.

## Structure highlights

- `_layouts/` defines Tailwind-styled templates for default pages, guides, and tools.
- `_includes/` houses shared UI such as the header, footer, SEO tags, and newsletter embed.
- `index.html`, `tools/`, `blog/`, and `about.md` provide example content that mirrors the MVP technical spec in `docs/MVP_TECH_SPEC.md`.
- `_posts/` contains a sample Lisbon field notes article to confirm the blog pipeline.

When you are ready to implement the real calculators, follow the spec in `docs/MVP_TECH_SPEC.md` to connect the front-end sections to Google Cloud Functions.
