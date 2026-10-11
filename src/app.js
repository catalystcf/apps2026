const app = document.createElement("div");
app.className = "app-shell";

const header = document.createElement("header");
header.className = "site-header";

const brand = document.createElement("a");
brand.className = "brand";
brand.href = "#";
brand.setAttribute("aria-label", "Open Space home");

const brandMark = document.createElement("span");
brandMark.className = "brand-mark";
brandMark.setAttribute("aria-hidden", "true");
brandMark.textContent = "o";

const brandName = document.createElement("span");
brandName.textContent = "open space";
brand.append(brandMark, brandName);

const headerLink = document.createElement("a");
headerLink.className = "header-link";
headerLink.href = "#welcome";
headerLink.textContent = "Explore";

header.append(brand, headerLink);

const main = document.createElement("main");
main.className = "page-content";
main.id = "welcome";

const welcomeCard = document.createElement("section");
welcomeCard.className = "welcome-card";
welcomeCard.setAttribute("aria-labelledby", "welcome-title");

const welcomeCopy = document.createElement("div");

const eyebrow = document.createElement("p");
eyebrow.className = "eyebrow";
eyebrow.textContent = "A little room to begin";

const heading = document.createElement("h1");
heading.id = "welcome-title";
heading.textContent = "Make space for what matters.";

const intro = document.createElement("p");
intro.className = "intro";
intro.textContent =
  "A calm, simple starting point for your next idea. Take a breath, find your focus, and make today your own.";

welcomeCopy.append(eyebrow, heading, intro);

const artwork = document.createElement("div");
artwork.className = "welcome-art";
artwork.setAttribute("role", "img");
artwork.setAttribute("aria-label", "A warm sun rising over soft green hills");

const sun = document.createElement("span");
sun.className = "sun";
sun.setAttribute("aria-hidden", "true");
sun.textContent = "✳";
artwork.append(sun);

welcomeCard.append(welcomeCopy, artwork);
main.append(welcomeCard);

const footer = document.createElement("footer");
footer.className = "site-footer";
footer.textContent = "A simple place to start.";

app.append(header, main, footer);
document.body.append(app);
