
pub const DEFAULT_PAGE: &str = r#"
<!DOCTYPE html>
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
<h1>this is a dartfrog page </h1>
<p> The creator of this page can edit it by clicking "edit" in the bottom left. </p>
<p> After saving an edit, the new version goes live immediately, including to users who are actively viewing the page. </p>
</body>
</html>
"#;
