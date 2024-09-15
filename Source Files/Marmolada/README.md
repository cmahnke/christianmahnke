# Italian elevation data

* https://tinitaly.pi.ingv.it/Download_Area1_0.html
* https://www.regione.veneto.it/web/agricoltura-e-foreste/modello-digitale-del-terreno

# Blender

* https://somethingaboutmaps.wordpress.com/blender-relief-tutorial-getting-set-up/
* https://github.com/joewdavies/geoblender


https://earth.google.com/web/search/Belvedere+di+Canazei/@46.495287,11.7513511,2417.22912892a,0d,72.97249038y,110.60841853h,80.01977061t,0r/data=CiwiJgokCYX7Ko69OkdAEYX7Ko69OkdAGYgUKg89mSdAIYgUKg89mSdAQgIIASIwCixBRjFRaXBNYVg0aDdGeTRMRXZaWkhRUFF4eDVfTGd4NGh0WGNXdHdDSjFlUhAFOgMKATA
https://maps.app.goo.gl/vFW7pE6TXFaHUbgp7 Aufnahme von Marco Beretta August 2024


https://maps.app.goo.gl/545mnDBXoE2HDC8H8
<iframe src="https://www.google.com/maps/embed?pb=!4v1726427311620!6m8!1m7!1sCAoSLEFGMVFpcE1hWDRoN0Z5NExFdlpaSFFQUXh4NV9MZ3g0aHRYY1d0d0NKMWVS!2m2!1d46.495287!2d11.7513511!3f98.78276099443083!4f4.4556945190209944!5f1.4219312166764295" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>

falesia Col Rodella, Località Passo Sella, 38031 Campitello di Fassa TN, Italien

# Scaling of elevation

```
gdal_translate -scale 1017.478027 3330.969971 0 65535 -ot UInt16 -of GTiff  "Source Files/Marmolada/clipped.tif" "Source Files/Marmolada/scaled.tiff"
```


# Blender
* https://blender.stackexchange.com/questions/212891/how-can-i-add-emission-to-the-mortar-of-a-grid-texture
