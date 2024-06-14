pub const DEFAULT_HTML : &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-weight: 400;

  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 0.8rem;
}
h1 {
  font-size: 1rem;
  line-height: 1.1;
}

    </style>
</head>
<body>
<h1>dartfrog Release Notes - Version 0.2.1</h1>
<img src="https://bwyl.nyc3.digitaloceanspaces.com/kinode/dartfrog/chat_images/kino.webp" alt="Kino" width="200" height="200">
<p>In 0.2.1, chat is fr just a plugin.</p>
<p>New plugins:
    <ul>
        <li>multiplayer piano</li>
        <li>chess (with spectator mode)</li>
        <li>"page" for HTML+CSS, which is what you're reading now.</li>
    </ul>
</p>
<p>If a page plugin is hosted on your node, you can edit it with the "edit" button in the bottom left.</p>
</body>
</html>"#;

