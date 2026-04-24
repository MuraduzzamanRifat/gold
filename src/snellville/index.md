---
layout: location
location: locations[0]
pageTitle: "Gold Kings Snellville, GA — Buy Gold | 770-771-4650"
pageDescription: "Gold Kings Snellville location. Fast cash for gold, silver & valuables. 770-771-4650. Open daily."
---

<!-- HERO SECTION -->
<section class="hero" id="hero">
  <div class="hero__stage">
    <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop" alt="Gold Kings Snellville store">
  </div>
  <div class="hero__scrim"></div>

  <div class="hero__overlay">
    <div class="hero__eyebrow">
      <span class="hero__dot"></span>
      <span>Snellville, GA Location</span>
    </div>

    <h1 class="hero__title t-display">
      <span class="line">SELL YOUR <em>GOLD</em></span>
      <span class="line">Get Fair <em>Cash Today</em></span>
    </h1>

    <div class="hero__foot">
      <div class="hero__cap">
        <span class="k">Phone</span>
        <span class="v">770-771-4650</span>
      </div>
      <div class="hero__cap hero__cap--mid">
        <a href="#contact" class="hero__cta">Get Directions</a>
      </div>
      <div class="hero__cap hero__cap--end">
        <span class="k">Service</span>
        <span class="v">Walk-Ins Welcome</span>
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
      <span>INSTANT CASH</span><i>◆</i>
    </div>
  </div>
</section>

<!-- LOCATION DETAILS SECTION -->
<section class="location-hero" id="contact">
  <div class="location-container">
    <div class="location-info">
      <span class="t-eyebrow">◆ Snellville Location</span>
      <h2 class="location-title">Visit Our <em>Snellville Store</em></h2>

      <div class="location-details">
        <div class="detail-group">
          <h3 class="detail-label">Address</h3>
          <p class="detail-value">
            <a href="https://maps.google.com/?q=Snellville,GA" target="_blank" rel="noopener noreferrer" class="detail-link">
              Snellville, Georgia
            </a>
          </p>
        </div>

        <div class="detail-group">
          <h3 class="detail-label">Phone</h3>
          <p class="detail-value">
            <a href="tel:+17707714650" class="detail-link" data-cursor="link">770-771-4650</a>
          </p>
        </div>

        <div class="detail-group">
          <h3 class="detail-label">Store Hours</h3>
          <ul class="hours-list">
            {% for hour in location.hours %}
            <li><span>{{ hour.day }}</span><span>{{ hour.time }}</span></li>
            {% endfor %}
          </ul>
        </div>

        <div class="detail-group">
          <h3 class="detail-label">We Buy</h3>
          <ul class="accept-list">
            <li>Gold Jewelry & Chains</li>
            <li>Gold & Silver Coins</li>
            <li>Sterling Silver Items</li>
            <li>Vintage Gold Watches</li>
            <li>Gold Rings & Bracelets</li>
            <li>Precious Metal Scrap</li>
          </ul>
        </div>
      </div>

      <div class="location-actions">
        <a href="tel:+17707714650" class="btn btn-primary">Call Now</a>
        <a href="https://maps.google.com/?q=Snellville,GA" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Get Directions</a>
      </div>
    </div>

    <div class="location-visual">
      <div class="map-placeholder">
        <iframe
          src="{{ location.mapEmbed }}"
          width="100%"
          height="500"
          allowfullscreen=""
          loading="lazy"
          title="Gold Kings Snellville Location Map">
        </iframe>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS FROM SNELLVILLE -->
<section class="gallery" id="reviews" role="region" aria-labelledby="reviews-heading">
  <div class="gallery__head">
    <span class="t-eyebrow">◆ Customer Reviews</span>
    <h2 class="gallery__title" id="reviews-heading">What Snellville Customers <em>Say</em></h2>
    <p class="gallery__sub">Real reviews from local customers who trust Gold Kings Snellville.</p>
  </div>

  <div class="testimonials-grid">
    {% for testimonial in location.testimonials %}
    <div class="testimonial-item">
      <blockquote class="testimonial-quote">"{{ testimonial.quote }}"</blockquote>
      <cite class="testimonial-name">{{ testimonial.name }}</cite>
      <span class="testimonial-rating">⭐⭐⭐⭐⭐</span>
    </div>
    {% endfor %}
  </div>
</section>

{% include "benefit-cards.html" %}

<!-- CTA SECTION -->
<section class="cta-section">
  <div class="cta-content">
    <h2 class="cta-title">Ready to Sell Your Gold?</h2>
    <p class="cta-subtitle">Visit Gold Kings Snellville today for a free evaluation and instant cash.</p>
    <div class="cta-actions">
      <a href="tel:+17707714650" class="btn btn-primary btn-large">Call 770-771-4650</a>
      <a href="https://maps.google.com/?q=Snellville,GA" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-large">Get Directions</a>
    </div>
  </div>
</section>
