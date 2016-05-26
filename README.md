# Michi
Node Email Builder

## Requirements
* [Node 6.x](https://nodejs.org/)

## Install

```shell
$ npm install michi -g
```

## Features

* [Dust](http://www.dustjs.com/) templates
* [SASS](http://sass-lang.com/) stylesheets
* i18n support

## Quick Start
**Setup workspace**
```shell
$ michi --setup
```

<pre>
michi/
  build/
  src/
    untitled/
      styles/
        global.scss
        head.scss
      templates/
        index.dust
      i18n/
        us.js
      img/
      config.js
  michi.config.js
</pre>

**Build project**
```shell
$ michi --build
```

<pre>
michi/
  <b>build/
    untitled/
      img/
      index_us.html</b>
  src/
    ...
  michi.config.js
</pre>

## Context Object

Templates have access to a context object, which contains the config module, a single i18n module, and compiled stylesheets.

## Project Anatomy

### Workspace Config

Michi loads **michi.config.js** first to determine which projects to build. In the following example, the project folder `michi/src/untitled` will be loaded and compiled.

```javascript
module.exports = {
    'projects': ['untitled']
};
```

### Project Config

Each project contains a **config.js** module, which is the primary context object passed to each template for all locales. The purpose of these modules is to store data/flags for manipulating Dust templates. For example, telling a Dust template which kind of hero snippet to render.

```javascript
module.exports = {
    'hero': {
        'format': 'wide'
    }
};
```

### i18n

i18n modules are for storing localized copy that is passed to each template. For each locale module, Michi will generate a separate HTML file and append the module's filename at the end. For example, if this module's filename were `us.js`, the build filename would be `index_us.js`.

```javascript
module.exports = {
    'title': 'Tommy Tricker and the Stamp Traveler',
    'description': 'When the joker Tommy Tricker plays some practical jokes on some of his friends, his best friend Ralph, a stamp collector, discovers the secret of "stamp travel" to make him travel around the world on a stamp to bring back the mysterious Charles Merriweather, who never returned on a stamp for 75 years.'
};
```

### Templates

```html
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <title>{i18n.title}</title>
    <style>
        {styles.head_css|s}
    </style>
</head>
<body>
    <h1>{i18n.title}</h1>
    <p>{i18n.description}</p>
</body>
</html>
```

### Styles

Classes in the **global.scss** stylesheet are parsed and bundled in the context's 'styles' property, and all stylesheets are stored separately with corresponding filenames.

```sass
// global.scss

.title {
    font-size: 18px;
}
```

```sass
// head.scss

@media only screen and (max-width: 320px) {
    ...
}
```

```html
<style>
    {styles.head_scss}
</style>

<h1 style="{styles.title}">...</h1>
```