# SlideFlowy

﻿The application is unpacked from [NutStore_Flowy](https://cpclanding.jianguoyun.com/yiyang/notes) which is not a open source app. But by mistake they left the `.js.map` file in the application and I found them.

I get the source with `reverse-sourcemap` and try to rebuild the dependences.

But it seemed that their are lots of `errors`. As a student, I  don't have enough time to fix it.

## code

The source seemed like to be based on `react` and `typescript`, and `webpack`.
There is a private pack which named `NutstoreSDK`, it only helps to load the file, show the app and the download the slide, which has little connection with the app.

So rebuild the source and fix the errors because of different development enviroments, you'll get a outlien app with slides.

I don't get any `LICENCE`, so it can not be used in commerce...

The code is highly readable/ In fact, it was not encoded and with notes in chinese, the name of the variables are regular. It's easy to rebuild!

## Source

I've provide anything I got which is readable.
