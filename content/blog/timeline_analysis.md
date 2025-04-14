---
title: "analyzing my travels during my time in paris [WIP]"
date: 2025-02-12
draft: false
---

For the first time in my life, I lived in Paris from the 1st of August 2024 to the 14th of February 2025. I had an internship as part of my studies there. Living here was great and not having brought my gaming desktop with me, I had a lot of time to do actual real life activites and go out. This first blog post is dedicated to the analysis of my travels during that time.

I use Google Maps a lot and I let Google collect my data for the Timeline feature. I figured since I let Google know literally everything about my life (recently made some progress by switching to [ProtonMail](https://proton.me/mail)), I might actually use that data for something interesting and fun.

To be honest, it's not that bad since the data is actually [stored on my mobile device and not on some Google servers anymore](https://www.techradar.com/computing/software/google-maps-is-about-to-get-a-big-privacy-boost-but-fans-of-timeline-may-lose-their-data).

Anyways, the first thing I noticed when I opened that `Timeline.json` is the fact that not only they collect EVERY single one of my "movements" (they also generate logs when you're being still), they also make some conclusions from the data. Here's an example:

```
"userLocationProfile": {
    "frequentPlaces": [
      {
        "placeId": "ChIJAAAAAAAAAAARbk8mvwlXtro",
        "placeLocation": "48.xxxxxxx°, 2.xxxxxxx°",
        "label": "HOME"
      },
      {
        "placeId": "ChIJAAAAAAAAAAARXXrubcHnXVs",
        "placeLocation": "48.xxxxxxx°, 2.xxxxxxx°"
      },
      {
        "placeId": "ChIJAAAAAAAAAAAR91LnZETpNb8",
        "placeLocation": "48.xxxxxxx°, 2.xxxxxxx°",
        "label": "WORK"
      },
      {
        "placeId": "ChIJAAAAAAAAAAARPU_4hKQClJc",
        "placeLocation": "48.xxxxxxx°, 2.xxxxxxx°"
      }
    }
```

So without doing anything, I can already know the places I was the most at. Thanks Google, I guess. Though I haven't figured out on which timespan this is actually measured.

So this json file has 3 main properties: `"semanticSegments"`; `"rawSignals"`; and `"userLocationProfile"`, making for approximately 29.7%, 70.3% and <0.001% of the total file. 

The first idea that came to mind when thinking about visualizing this data was to generate a heatmap of my travels. For this, the `semanticSegments` property seemed like the right fit. This property categorizes these segments in three distinct properties: `"timelinePath"`; `"activity"`; and `"visit"`. To my understanding, the first ones are random raw location tracking points with timestamps, the second ones are movements between two points of interest, and the third ones are stays at specific locations.

I feel like doing a heatmap of my visits is the most interesting as it's showing actual places I spent my time at instead of simple routes I've taken. So by analyzing this data using a python script with folium, numpy and pandas, we get this: 

{{< embed_map "/assets/heatmap.html" >}}

Most of my time is actually spent between the 11th (where I live), the 5th (where all the cinemas are... and where my girlfriend lives) and the 9th (where I worked). I've actually not spent a single minute in the 16th arrondissement (I wonder why...).

If you zoom out enough, you can see that I've spent quite some time with my family, in Metz, and a week split between Grenoble and Marseille.

Unfortunately, it seems that the data that we're able to download only includes a start point and an end point for each travel in the `"activity"` property. Though this could be bypassed by using some API to recreate an direction for each travel. This is a good enough alternative but it isn't really accurate as I may have taken a completely different route than the optimized one to go from one point to another.

First I wanted to go with the [openrouteservice](https://openrouteservice.org) API but the rate limits are way too low for our use case. The Google Maps Direction API seemed like a good alternative (they offer 200$/month of free credit and the rate limits are quite high), though it isn't open source...
