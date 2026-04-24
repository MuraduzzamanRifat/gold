---
layout: base
pageTitle: "Gold Kings — We Buy Gold | Fast Cash, Fair Prices"
pageDescription: "Sell your gold, silver & valuables for instant cash. Fair prices, professional service. Find the store near you."
---

<!-- PRELOADER -->
<div class="preloader" id="preloader">
  <!-- Large Rolling Coin -->
  <div class="large-coin-container">
    <div class="large-coin">
      <div class="coin-ring"></div>
      <div class="coin-shine"></div>
    </div>
  </div>

  <div class="pre-center">
    <div class="pre-brand">GOLD KINGS</div>
    <div class="pre-sub">ONLINE</div>
    <div class="pre-counter">
      <span id="pc">00</span><span class="pre-slash">/</span><span>100</span>
    </div>
    <div class="pre-status" id="pc-status">Evaluating your gold</div>
  </div>
  <div class="pre-bar"><span id="pre-bar-fill"></span></div>
</div>

<!-- HERO SECTION -->
<section class="hero" id="hero">
  <div class="hero__stage">
    <canvas id="hero-canvas"></canvas>
  </div>
  <div class="hero__scrim"></div>

  <div class="hero__overlay">
    <div class="hero__eyebrow">
      <span class="hero__dot"></span>
      <span>Trusted Since 2008</span>
    </div>

    <h1 class="hero__title t-display">
      <span class="line">WE BUY <em>GOLD</em></span>
      <span class="line">Fast Cash, Fair <em>Prices</em></span>
    </h1>

    <div class="hero__foot">
      <div class="hero__cap">
        <span class="k">Service</span>
        <span class="v">Instant Evaluation</span>
      </div>
      <div class="hero__cap hero__cap--mid">
        <a href="#quote" class="hero__cta">Get a Quote Now</a>
      </div>
      <div class="hero__cap hero__cap--end">
        <span class="k">Turn</span>
        <span class="v">valuables to cash</span>
      </div>
    </div>
  </div>

  <div class="hero__marquee" aria-hidden="true">
    <div class="hero__marquee-track">
      <span>INSTANT CASH</span><i>◆</i>
      <span>FAIR PRICES</span><i>◆</i>
      <span>PROFESSIONAL SERVICE</span><i>◆</i>
      <span>GOLD & SILVER</span><i>◆</i>
      <span>JEWELRY & COINS</span><i>◆</i>
      <span>FAST EVALUATION</span><i>◆</i>
      <span>INSTANT CASH</span><i>◆</i>
      <span>FAIR PRICES</span><i>◆</i>
      <span>PROFESSIONAL SERVICE</span><i>◆</i>
    </div>
  </div>
</section>

<!-- TESTIMONIALS SECTION -->
<section class="gallery" id="testimonials" role="region" aria-labelledby="testimonials-heading">
  <div class="gallery__head">
    <span class="t-eyebrow">◆ Customer Reviews</span>
    <h2 class="gallery__title" id="testimonials-heading">Trusted by <em>Thousands</em></h2>
    <p class="gallery__sub">See what our customers have to say about Gold Kings.</p>
  </div>

  <div class="gallery__grid" id="gallery-grid" role="list"></div>
</section>

<!-- HOW IT WORKS / SCROLL-PINNED SECTION -->
<section class="showcase" id="howitworks">
  <div class="showcase__scroll" id="showcase-scroll">
    <div class="showcase__sticky">
      <canvas id="showcase-canvas"></canvas>

      <div class="showcase__ui">
        <div class="showcase__label t-eyebrow">Process</div>
        <div class="showcase__slide-info">
          <span class="showcase__k" id="sc-k">Step One</span>
          <span class="showcase__v" id="sc-v">Bring Your Gold</span>
        </div>
        <div class="showcase__progress">
          <span class="sdot active"></span>
          <span class="sdot"></span>
          <span class="sdot"></span>
          <span class="sdot"></span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- LOCATIONS SECTION -->
<section class="about" id="locations">
  <div class="about__grid">
    <div class="about__visual" data-reveal>
      <img src="https://images.pexels.com/photos-1800x1200-3945683.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop" alt="Gold Kings store">
      <span class="about__caption">Professional Gold Buying Service</span>
    </div>

    <div class="about__text">
      <span class="t-eyebrow">◆ Our Locations</span>
      <h2 class="about__title">Find Your Nearest <em>Store</em></h2>
      <p class="about__body">
        Visit one of our Gold Kings locations to sell your gold, silver, jewelry, and valuables for instant cash. Our experienced professionals provide fair evaluations and the best prices in the area.
      </p>
      <div class="locations-list" role="list">
        {% for location in locations %}
        <div class="location-item" role="listitem">
          <h3 class="location-city">{{ location.city }}, {{ location.state }}</h3>
          <a href="tel:{{ location.phone }}" class="location-phone">{{ location.phone }}</a>
          <div class="location-actions">
            <a href="./{{ location.id | lower }}/" class="location-call" aria-label="Visit {{ location.city }} store">Visit Store</a>
            <a href="tel:{{ location.phone }}" class="location-call" aria-label="Call {{ location.city }} store">Call Store</a>
          </div>
        </div>
        {% endfor %}
      </div>
    </div>
  </div>
</section>
