---
date: 2026-02-22T10:39:44+02:00
title: "A rant about Deutsche Bahn"
tags:
  - Travel
wikidata:
  - https://www.wikidata.org/wiki/Q129172
  - https://www.wikidata.org/wiki/Q9322
  - https://www.wikidata.org/wiki/Q110087903
  - https://www.wikidata.org/wiki/Q1392385
---

This article was written partly on the train, which arrived at its destination 80 minutes later than planned.
<!--more-->

I commute between Hanover and Göttingen several times a week and have almost got used to trains being 30 minutes late. Today, however, was particularly bad: instead of two 35-minute delays, it took about 115 and 70 minutes. A new low.

**So I felt compelled to write this post:**

As a rail customer, you have had to put up with more and more in recent years. The railways have a massive quality problem. On top of that, you have to wonder whether they are not also spending resources on covering up this problem. A classic example, of course, is that cancelled trains do not count as delays and [the Deutsche Bahn exploits this fact to improve its statistics](https://www.spiegel.de/wirtschaft/deutsche-bahn-laesst-offenbar-zuege-ausfallen-um-statistik-zu-verbessern-a-c98d916e-770e-4f61-90f5-83c9dcc3db12).

If you are late, you are entitled to passenger rights or a refund, but the process is not nearly as simple as it could or should be. It starts with the fact that the necessary data cannot be researched.

The Deutsche Bahn's information policy has deteriorated significantly over the last ten years. For example, it is no longer possible to find out about past train journeys. The Deutsche Bahn will have its reasons.
This also applies to the display in the DB Navigator: the actual data is not shown there for past journeys either.

As a result, an ecosystem of external services has emerged to compensate for this:
* [bahn.expert](https://bahn.expert/)
* [Bahn-Vorhersage](https://bahnvorhersage.de/)
* [verspaetung.net](https://verspaetung.net/)
* [Zugfinder](https://www.zugfinder.net/de/start)

This list is certainly not exhaustive. 

In my view, this is a clear indication that there is a need for transparency that the "DB Navigator" app or the Deutsche Bahn's website cannot meet. 

There is a lot to criticise about the app in particular. I don't even want to get started on issues such as privacy ([through third-party cookies](https://www.kuketz-blog.de/db-navigator-datenschutz-faellt-heute-aus-app-check-teil1/)) when using the Deutsche Bahn app; others have already written extensively on this topic.

This article is more about reimbursement via the DB Navigator app...

## The compensation process

To be honest, I also find it annoying that users have to "apply" for reimbursement. It would be better to use wording that better reflects the fact that Deutsche Bahn is in breach of contract. The button doesn't have to be called "Grant absolution", but I think it would be better to talk about compensation rather than reimbursement.

Which brings us to the "Antrag". It is so poorly integrated into "DB Navigator" that one has to wonder whether this is a case of dark patterns or "merely" a reflection of incompetence in media design. 

To cut a long story short: there is the [paper form](https://www.bahn.de/wmedia/view/mdb/media/intern/fahrgastrechteformular.pdf) and an electronic version of it, which Deutsche Bahn expects users of the app to fill out. And here you can see what I would call incompetent media design: the form is simply replicated without using the existing data in the default settings. In my case, all the information required for a refund is stored in the app: my bank details (and even if these were not stored, they would still be linked to the BahnCard data record) and the connection I am currently on. In principle, it would be possible to implement the refund via a button next to the "Comfort Check-in". Again: **A button, not a form**, for simple cases (single journey without changing trains).
The consequences of the implemented approach can be seen here: The screenshot shows my attempt to request a refund before the train arrived – it doesn't work.

{{< figure src="erstattung.jpeg" title="Erstattung beantragen bevor der Zug ankommt" >}}

And at this point, at the latest, the question arises as to whether this is a case of incompetence or whether [dark patterns](https://de.wikipedia.org/wiki/Dark_Pattern) are at work here:
* If the form had been optimised efficiently, the train number would suffice. Instead, it asks what the planned times were (at least these are pre-filled).
* Why do you have to wait until you get there? At that point, I was already eligible for the 60-minute refund. Why can't they do that in the time that the Deutsche Bahn is already robbing you of? Why do you have to fill this out at all? The Deutsche Bahn knows the train number.
* Why do you have to fill in all your personal details again? These are also stored in the app.
* Why can't you go back, but only cancel and start again from the beginning? (I only noticed this when I was writing the article.)

Some of the problems mentioned above are simply due to the extremely unfortunate way in which they have been implemented: the dialogue is part of the Deutsche Bahn's website, not the app. This means that authentication for access to the user account is not passed through. Another reason is the still widespread misconception that online forms must replicate paper (or PDF) forms one-to-one, as if there were no media-specific characteristics of online media. In addition, it is assumed that a form must cover all cases. That is why all options are displayed even for a simple journey – both are classic mistakes in administrative digitisation.

Ideally, the process should be reversed: all available data is transferred and as soon as I can complete the process, this is possible. Additional optional data that is not required for all cases (in this case, a single journey), such as information on additional expenses or whether partial routes are used, is only requested after the first submission option.

I hope that Deutsche Bahn will provide APIs that third-party providers can use to create better front ends (apps) that offer a better service. These APIs should, of course, also enable booking, "comfort check-in", the deposit of (time) tickets and refunds, so that they represent a fully-fledged replacement.

## What should change:

It is difficult to understand why absolute delay times are calculated in a system where route lengths vary.
I would suggest basing the delay required for reimbursement on the planned journey time. So instead of working with fixed values such as 60 or 120 minutes, the thresholds should be 100%, 200% and more percent of the planned journey time exceeded. An example based on the connection (ICE 583) from the introduction:

The planned departure from Hanover was at 8:23 a.m., with the planned arrival in Göttingen at 8:59 a.m. The actual arrival was at 10:19 a.m., i.e. with a delay of one hour and 20 minutes.
Since the planned journey time is 36 minutes, according to the proposed model, the first reimbursement level would be reached at 9:35 a.m. and the second at 10:01 a.m. In this specific case, the reimbursement would therefore be 50% instead of 25%.

The existing system has the disadvantage, especially for commuters, that it is based on individual connections. This means that if I travel 20 times a month and arrive 15 minutes late on 10 of those occasions, I have a total delay of 150 minutes, but still come away empty-handed. Only if there are several delays of more than 20 minutes each is it possible to add them up.

There is also a cap: amounts under £4 are not paid out. Since these processes are hopefully highly automated, I see no real reason for this. If it is only a matter of payment, the Deutsche Bahn can set up a shadow account and collect amounts there until the limit is reached. Alternatively, it can also issue vouchers or donate the money. Retention should not be an option!

In addition, they are required to arrange for reimbursement quickly – as if the Deutsche Bahn were entitled to presume any competence in terms of speed or deadlines. The deadline should therefore be twelve months.

Another idea would be to simply declare the delay as loss of earnings and base this on the wage or income for the additional time.

## Conclusion

The Deutsche Bahn is doing a lot to make it difficult to enforce claims. This must come to an end!
Refunds should be easier than "comfort check-in" in DB Navigator. Anyone who believes that the cleanliness of railway stations is an important problem that needs to be solved is either incompetent or trying to manipulate public opinion. When forced to wait, I would rather have good WiFi than "cleanliness".
In addition, a minimum reliability threshold should be set, exceeding which would justify price increases. The next fare increase should only take place if the rate exceeds 70% for six months. Anything below that is more of a reason for a price reduction.

And finally, the "DB Navigator" and its ecosystem, precisely because the Deutsche Bahn is doing so much to force its customers to use the app (e.g. no more saver fares at ticket machines):
* There should be at least one public bug tracker to make it more transparent which processes and responsibilities lead, for example, to the inability to see delays on past journeys or why multi-journey tickets are still not properly integrated after at least two years.
* Deutsche Bahn must allow all necessary APIs for the implementation of fully-fledged DB Navigator clones by third-party providers. As a monopolist, it should not also be allowed to act as a gatekeeper in its own interests.