pub const default_html : &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
h1 {
  font-size: 1.2em;
  line-height: 1.1;
}

    </style>
</head>
<body>
<h1>DartFrog Release Notes - Version 0.2.1</h1>
<img src="https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/kino.webp" alt="Kino" width="200" height="200">
<p>In 0.2.1, chat REALLY is just a plugin. its backend is about 100 lines of code.</p>
<p>more plugins: a networked piano, and a "page" plugin for html+css, which is what you're reading now.</p>
</body>
</html>"#;

