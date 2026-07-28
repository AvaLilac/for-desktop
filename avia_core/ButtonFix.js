0simp — Today at 4:32 PM
i mean if it works it works
ig ill start trying to fix mobile
Amythyst-Ava — Today at 4:32 PM
im glad this survived though so ye




Image
0simp — Today at 4:33 PM
at least they didnt break everything ig
Amythyst-Ava — Today at 4:33 PM
we have a branch setup dedicated to fixing it so as fixes get pushed just update to that
Amythyst-Ava — Today at 4:33 PM
well the button is a bit weird but it works
0simp — Today at 4:33 PM
theres also a bunch of mobile only stuff that broke
because ofc there is
Amythyst-Ava — Today at 4:34 PM
relies heavily on classes
0simp — Today at 4:34 PM
although i should be able to just remove some of it since they fixed some context menus
Amythyst-Ava — Today at 4:34 PM
good
plugins like notifications. and Account switcher dont rely on any classes
it acually has its own
which is why they work under fluxer thank god
DUDE
DUDE
THEY PUSHED IT
THEY PUSHED IT
0simp — Today at 4:35 PM
oh jesus literally all my plugins broke i swear
ughhhhh
Amythyst-Ava — Today at 4:38 PM
alright can you fix button fix for me
0simp — Today at 4:38 PM
sure whats wrong with it
Amythyst-Ava — Today at 4:38 PM
it closes any panel when i start typing
i am so tired of this i dont want to go back into this
0simp — Today at 4:39 PM
alr ill try
if i fix this ig it kinda counts as me contributing? in a way?
Amythyst-Ava — Today at 4:40 PM
so
i was talking to pierce
we were talking about the new css
he thinks it re generates on every release
not confirmed but
0simp — Today at 4:40 PM
...
Amythyst-Ava — Today at 4:40 PM
im gonna ask
0simp — Today at 4:40 PM
istfg
if it does
i might just not bother maintaining my shit anymore
its not like i use the platform anyway
0simp — Today at 4:41 PM
emphasis on the might because knowing me i could decide to do it anyway but still
Amythyst-Ava — Today at 4:43 PM

Image
0simp — Today at 4:44 PM
fuck em
Amythyst-Ava — Today at 4:44 PM
i swear
they are trying to fuck avia up
0simp — Today at 4:44 PM
probably
they clearly hate you
so i wouldnt be surprised
i wouldnt blame u if u just gave up tbh
im not saying u have to but if u decide to do so i wouldnt blame u at all
Amythyst-Ava — Today at 4:57 PM
im honestly crying
0simp — Today at 4:57 PM
so its pretty much confirmed ur client is cooked
correct?
bro theyre such fucking dickheads its crazy

Image
i feel bad for u, not only for having ur entire project ruined but also for having to deal with these assholes
Amythyst-Ava — Today at 5:02 PM
i quit
or not
i dont fucking know
im overwhelmed
0simp — Today at 5:02 PM
again if u do i honestly cant blame u
i would in ur situation
but its up to u
yk what
if u think u wanna quit maintaining avia anyway..
should we give em what they deserve
Amythyst-Ava — Today at 5:06 PM
no
im not trying to get banned
0simp — Today at 5:06 PM
alr
0simp — Today at 5:15 PM
btw i fixed buttonfix if u still want it fixed

(function () {
    if (window.__BUTTON_FIX__) return;
    window.__BUTTON_FIX__ = true;

    function uninjectButton(button) {
        if (button?.parentElement) {
            button.parentElement.removeChild(button);
        }
    }

    function hasGifButton() {
        return [...document.querySelectorAll("button")].some(button =>
            button.querySelector(".material-symbols-outlined")?.textContent.trim() === "gif"
        );
    }

    const observer = new MutationObserver(() => {
        const injectedButtons = [];

        document.querySelectorAll("div").forEach(element => {
            if (element.id?.includes("avia")&&element.parentElement!=document.body) {
                injectedButtons.push(element);
            }
        });

        if (!hasGifButton()) {
            injectedButtons.forEach(uninjectButton);
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

ButtonFix.js
968 B



Amythyst-Ava — Today at 5:16 PM
we may not be lost
0simp — Today at 5:16 PM
they dont regenerate every update?
Amythyst-Ava — Today at 5:16 PM
for-web compiles to a static website
meaning we can host the compiled on github pages
we can host for-web without paying
thing is
0simp — Today at 5:17 PM
are you sure thats gonna work
Amythyst-Ava — Today at 5:17 PM
im not sure if that can be done entirely through github workflows
i dont have the storage
Amythyst-Ava — Today at 5:17 PM
dude
the guy who works on for-web says so
i know we dislike them and all
but honestly
i've seen the code
this acually makes sense by looking at the code
this is possible
i believe them
0simp — Today at 5:20 PM
so if u did this would u discontinue avia desktop and all that lot
and just have it be on ur  hosted version
Amythyst-Ava — Today at 5:23 PM
no?
just point avia desktop to the url
0simp — Today at 5:23 PM
oh
thats smart
Amythyst-Ava — Today at 5:23 PM
i still think injection method is the best way
i am not going in dat code
0simp — Today at 5:24 PM
yeah dont
Amythyst-Ava — Today at 5:36 PM
Amelia suggested integrating for-web into the client itself. i brought up how if we do that method it would make it impossible for your fork to exist. so i suggested if its possible to use github workflow to auto compile for-web and publish it to gitpages
that way we can point the client to gitpages. and you can focus your client on it
0simp — Today at 5:36 PM
dont worry about my fork
Amythyst-Ava — Today at 5:36 PM
i will anyway
0simp — Today at 5:36 PM
im probably done with it anyway
Amythyst-Ava — Today at 5:36 PM
if we do this idea
we can disable that stupid css thing
0simp — Today at 5:37 PM
wait so would this idea allow u to stay up to date without the css shit?
Amythyst-Ava — Today at 5:37 PM
yep
if we do it
0simp — Today at 5:37 PM
oh wow
Amythyst-Ava — Today at 5:37 PM
this is why they suggested it
they suggested doing this because we can disable the minifier
0simp — Today at 5:37 PM
i thought it basically meant just stay on one vesion
but this could actually work
Amythyst-Ava — Today at 5:37 PM
if we setup a workflow. all we have to do is merge newer releases
and workflow would take care of it
though the issue is
neither me and amelia have experience with it
to be fair we had no experience with electron and look at it about 1 day ago
0simp — Today at 5:38 PM
would the fact that they blocked u cause any issues
Amythyst-Ava — Today at 5:38 PM
amelia would have to fork it
into the org
0simp — Today at 5:39 PM
assuming they havent blocked her too
which they prob havent
and if they have/do in the future theyre def tryna shut down avia
Amythyst-Ava — Today at 5:39 PM
its weird that they suggested a good idea if there trying to shut avia down
if it indeed compiles into a static page. possible
100%
0simp — Today at 5:40 PM
and all of this wouldnt be necessary if they didnt make the classes change every update
anyway at least theres a solution ig
Amythyst-Ava — Today at 5:41 PM
if we ended up doing this solution
it would be so much easier to maintain avia client
0simp — Today at 5:41 PM
if u dont its gonna be near impossible
Amythyst-Ava — Today at 5:41 PM
after so
Amythyst-Ava — Today at 5:41 PM
not near
it is impossible
well
sorta impossible
0simp — Today at 5:42 PM
you could technically do it but itd take u so long to update all ur plugins that by the time u did the next update would be out
Amythyst-Ava — Today at 5:42 PM

Image
0simp — Today at 5:42 PM
and itd be an endless cycle
Amythyst-Ava — Today at 5:42 PM
some have a name next to it]
not all
but some stuff is using it

(function () {
    if (window.__BUTTON_FIX__) return;
    window.__BUTTON_FIX__ = true;

    function uninjectButton(button) {
        if (button?.parentElement) {
            button.parentElement.removeChild(button);
        }
    }

    function hasGifButton() {
        return [...document.querySelectorAll("button")].some(button =>
            button.querySelector(".material-symbols-outlined")?.textContent.trim() === "gif"
        );
    }

    const observer = new MutationObserver(() => {
        const injectedButtons = [];

        document.querySelectorAll("div").forEach(element => {
            if (element.id?.includes("avia")&&element.parentElement!=document.body) {
                injectedButtons.push(element);
            }
        });

        if (!hasGifButton()) {
            injectedButtons.forEach(uninjectButton);
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
