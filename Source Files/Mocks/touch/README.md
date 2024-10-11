Touch API test
==============

# Chrome extension
* [Installation instructions](https://dev.to/ben/how-to-install-chrome-extensions-manually-from-github-1612)
* [Vibrate extension](https://github.com/anth12/navigator.vibrate)

# Test sites

* https://googlechrome.github.io/samples/vibration/
* https://sbedell.github.io/vibrate

# Web Annotations
* https://www.w3.org/TR/annotation-model
* IIIF embeded annotations

* https://github.com/w3c/web-annotation/issues/428
* https://medium.com/@atakanguney94/the-standardization-of-annotations-3c9a5115f5fe

# Further considerations

* single touch is certainly reserved for panning - needs to be changed to double touch

## Preprocessing

### Force reinstall of Pillow

```
pip install --upgrade --force-reinstall pillow
```

### Updating Manifests

```
python scripts/update-manifest.py -i public/manifest.json -a public/page031-1.json
```
