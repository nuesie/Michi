<div><img src="http://i.imgur.com/PSA6IHh.png"></div>

**0.0.1** Node Email Builder

## Requirements
* [Node 6.x](https://nodejs.org/)

## Features
* [Dust](http://www.dustjs.com/) templates
* [SASS](http://sass-lang.com/) CSS
* i18n

## Install

```shell
$ npm install michi -g
```

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

### Workspace Config

```javascript
module.exports = {
    'projects': [
        'untitled', // michi/src/untitled
        'foobar',   // michi/src/foobar
        'foo'       // michi/src/foobar
    ]
};
```

## Project Anatomy

### Project Config

```javascript
module.exports = {
    'hero': {
        'format': 'wide'
    }
};
```

### i18n

```javascript
module.exports = {
    'title': 'Tommy Tricker and the Stamp Traveler',
    'description': 'When the joker Tommy Tricker plays some practical jokes on some of his friends, his best friend Ralph, a stamp collector, discovers the secret of "stamp travel" to make him travel around the world on a stamp to bring back the mysterious Charles Merriweather, who never returned on a stamp for 75 years.'
};
```

### Styles

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