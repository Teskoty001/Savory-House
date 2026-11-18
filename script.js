/* =========================================================
   SAVORY HOUSE - SCRIPT
   1. Helpers          2. Mobile navigation   3. Header + active link
   4. Menu filter      5. Gallery lightbox    6. Reservation form
   ========================================================= */

/* ---------- 1. Helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Footer year
$("#year").textContent = new Date().getFullYear();

// If a photo fails to load, hide the broken-image icon (the dark background shows instead)
$$("img").forEach((img) => img.addEventListener("error", () => img.classList.add("is-broken")));


/* ---------- 2. Mobile navigation ---------- */
const header = $("#site-header");
const navToggle = $("#nav-toggle");
const navLinks = $("#nav-links");

function setMenu(open) {
  navLinks.classList.toggle("is-open", open);
  header.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle.addEventListener("click", () => {
  setMenu(navToggle.getAttribute("aria-expanded") !== "true");
});

// Close the menu after choosing a link, or when pressing Escape
$$("a", navLinks).forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// Reset if the window grows past the mobile breakpoint
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setMenu(false);
});


/* ---------- 3. Header background + active link ---------- */
function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// Highlight the nav link for the section currently on screen
const sections = $$("main section[id]");
const navAnchors = $$('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((section) => sectionObserver.observe(section));


/* ---------- 4. Menu filter ---------- */
const tabs = $$(".tab");
const dishes = $$(".dish");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const filter = tab.dataset.filter;

    tabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.toggle("is-active", isActive);
      t.setAttribute("aria-pressed", isActive);
    });

    dishes.forEach((dish) => {
      const show = filter === "all" || dish.dataset.category === filter;
      dish.hidden = !show;
    });
  });
});


/* ---------- 5. Gallery lightbox ---------- */
const galleryItems = $$(".gallery-item");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbCaption = $("#lb-caption");
let currentIndex = 0;

function showPhoto(index) {
  // Wrap around at both ends
  currentIndex = (index + galleryItems.length) % galleryItems.length;
  const img = $("img", galleryItems[currentIndex]);
  lbImg.src = img.src.replace("w=600", "w=1600");   // load a larger version
  lbImg.alt = img.alt;
  lbCaption.textContent = img.alt;
}

function openLightbox(index) {
  showPhoto(index);
  lightbox.showModal();
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openLightbox(index));
});

$("#lb-close").addEventListener("click", () => lightbox.close());
$("#lb-prev").addEventListener("click", () => showPhoto(currentIndex - 1));
$("#lb-next").addEventListener("click", () => showPhoto(currentIndex + 1));

// Click the dark area around the photo to close
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

// Arrow keys (Escape is handled by the <dialog> itself)
document.addEventListener("keydown", (e) => {
  if (!lightbox.open) return;
  if (e.key === "ArrowLeft") showPhoto(currentIndex - 1);
  if (e.key === "ArrowRight") showPhoto(currentIndex + 1);
});


/* ---------- 6. Reservation form ---------- */
const form = $("#reservation-form");
const successBox = $("#success");

const dateInput = $("#date");
const timeSelect = $("#time");
const guestsSelect = $("#guests");

// Format a Date as YYYY-MM-DD in local time (for the date input's min value)
function toInputDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Fill the time options: 12:00 to 21:30, every 30 minutes
function buildTimeOptions() {
  for (let hour = 12; hour <= 21; hour++) {
    ["00", "30"].forEach((minutes) => {
      const label = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? "pm" : "am"}`;
      timeSelect.add(new Option(label, label));
    });
  }
}

// Fill the guest options: 1 to 10
function buildGuestOptions() {
  for (let i = 1; i <= 10; i++) {
    guestsSelect.add(new Option(i === 1 ? "1 guest" : `${i} guests`, i));
  }
}

buildTimeOptions();
buildGuestOptions();
dateInput.min = toInputDate(new Date());   // no dates in the past

// Each rule returns an error message, or "" when the value is valid
const rules = {
  name(value) {
    if (!value) return "Please enter your name.";
    if (value.length < 2) return "Your name should be at least 2 characters.";
    return "";
  },
  email(value) {
    if (!value) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Enter a valid email, like jane@example.com.";
    return "";
  },
  phone(value) {
    if (!value) return "Please enter your phone number.";
    const digits = value.replace(/\D/g, "");
    if (!/^[\d\s()+-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
      return "Enter a valid phone number (7 to 15 digits).";
    }
    return "";
  },
  date(value) {
    if (!value) return "Please choose a date.";
    if (value < toInputDate(new Date())) return "Please choose today or a future date.";
    return "";
  },
  time(value) {
    return value ? "" : "Please choose a time.";
  },
  guests(value) {
    return value ? "" : "Please select the number of guests.";
  },
};

// Check one field and show or clear its error message
function validateField(name) {
  const input = form.elements[name];
  const message = rules[name](input.value.trim());
  const field = input.closest(".field");

  field.classList.toggle("has-error", message !== "");
  input.setAttribute("aria-invalid", message !== "");
  $(`#${name}-error`).textContent = message;
  return message === "";
}

// Validate while typing, but only after the person has left the field once
Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("blur", () => validateField(name));
  input.addEventListener("input", () => {
    if (input.closest(".field").classList.contains("has-error")) validateField(name);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Check every field (don't stop at the first error, so all messages show)
  const results = Object.keys(rules).map(validateField);
  const allValid = results.every(Boolean);

  if (!allValid) {
    const firstInvalid = $(".has-error input, .has-error select", form);
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Front-end demo only: nothing is sent or stored anywhere
  const niceDate = new Date(dateInput.value + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const guests = Number(guestsSelect.value);

  $("#success-name").textContent = form.elements.name.value.trim();
  $("#success-details").textContent =
    `We have noted a request for ${guests} ${guests === 1 ? "guest" : "guests"} on ${niceDate} at ${timeSelect.value}.`;

  form.hidden = true;
  successBox.hidden = false;
  successBox.focus();
});

// Start a fresh request
$("#new-booking").addEventListener("click", () => {
  form.reset();
  $$(".field", form).forEach((f) => f.classList.remove("has-error"));
  $$(".error", form).forEach((el) => (el.textContent = ""));
  successBox.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});
