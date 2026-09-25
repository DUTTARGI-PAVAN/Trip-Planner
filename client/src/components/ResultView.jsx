import React from 'react';
import { LoadingState } from './LoadingState';

// Curated suggested plans with high-resolution photography and rich details
export const FEATURED_PLANS = {
  solo: [
    {
      id: "solo-kyoto",
      destination: "Kyoto, Japan",
      duration: "4 Days",
      title: "Kyoto Solo Photography & Zen Retreat",
      desc: "Wander through quiet morning bamboo groves, historic vermilion torii gates, traditional tea houses, and authentic hidden ramen bars.",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
      tags: ["Zen Temples", "Street Photography", "Ramen", "Tea Ceremony"],
      prompt: "4 days solo wandering in Kyoto exploring quiet morning shrines, bamboo groves, and hidden ramen bars"
    },
    {
      id: "solo-bali",
      destination: "Bali, Indonesia",
      duration: "5 Days",
      title: "Bali Solo Backpacker & Hidden Cafes",
      desc: "Discover Ubud's lush waterfalls, serene rice terraces, yoga retreats, vibrant co-working cafes, and coastal sunsets in Canggu.",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80",
      tags: ["Yoga & Surf", "Waterfalls", "Rice Terraces", "Cafe Culture"],
      prompt: "5 days solo retreat in Ubud and Canggu with yoga classes, co-working cafes, and scenic waterfalls"
    },
    {
      id: "solo-alps",
      destination: "Swiss Alps, Switzerland",
      duration: "3 Days",
      title: "Swiss Alps Alpine Trek & Panoramas",
      desc: "Hike world-class trails in Interlaken and Lauterbrunnen, ride scenic cogwheel trains, stay in cozy hostels, and savor Swiss fondue.",
      image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80",
      tags: ["Mountain Trekking", "Alpine Lakes", "Scenic Trains", "Fondue"],
      prompt: "3 days solo trekking in Interlaken and Lauterbrunnen with mountain hostels, fondue, and panoramic trails"
    },
    {
      id: "solo-paris",
      destination: "Paris, France",
      duration: "3 Days",
      title: "Paris Art, Bakeries & Culture Walk",
      desc: "Immerse in the Louvre, Montmartre cobblestones, bohemian bookshops along the Seine, and sunset views from quaint Parisian bistros.",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80",
      tags: ["Art Galleries", "Pastries & Cafes", "Montmartre", "Architecture"],
      prompt: "3 days solo cultural journey in Paris visiting the Louvre, Montmartre art studios, and historic bakeries"
    },
  ],
  group: [
    {
      id: "group-goa",
      destination: "Goa, India",
      duration: "4 Days",
      title: "Goa Beach Villa & Nightlife Fiesta",
      desc: "Book a beachside villa, rent scooters for coastal cruising, try thrilling water sports, and party at sunset shacks with your crew.",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
      tags: ["Private Villa", "Water Sports", "Beach Parties", "Seafood Shacks"],
      prompt: "4 days group party getaway to Goa with private beach shacks, sunset cruises, water sports, and seaside clubs"
    },
    {
      id: "group-tokyo",
      destination: "Tokyo, Japan",
      duration: "5 Days",
      title: "Tokyo Tech, Gaming & Izakaya Safari",
      desc: "Explore Akihabara VR arcades, teamLab immersive lights, Shibuya sky decks, singing karaoke lounges, and shared yakitori feasts.",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
      tags: ["Arcades & Gaming", "Karaoke", "teamLab Digital", "Izakayas"],
      prompt: "5 days group exploration in Tokyo hitting Akihabara arcades, teamLab digital art, Shibuya crossings, and izakayas"
    },
    {
      id: "group-manali",
      destination: "Manali, Himalayas",
      duration: "5 Days",
      title: "Manali Friends Road Trip & Adventure",
      desc: "Epic mountain road trip across Solang Valley featuring river rafting, campfire bonfires, paragliding, and lively Old Manali cafes.",
      image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
      tags: ["River Rafting", "Bonfire Nights", "Paragliding", "Mountain Cafes"],
      prompt: "5 days scenic group road trip to Manali and Solang Valley with river rafting, bonfires, and mountain cafes"
    },
    {
      id: "group-rome",
      destination: "Rome & Florence, Italy",
      duration: "4 Days",
      title: "Italian Heritage & Vineyard Tour",
      desc: "Skip lines at the Colosseum, embark on a scenic Tuscan vineyard day trip, and share authentic pizza and wine dinners with friends.",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80",
      tags: ["Colosseum Tour", "Wine Tasting", "Pizza & Pasta", "Florence Duomo"],
      prompt: "4 days group tour of Rome and Florence with Colosseum entry, shared pasta feasts, and vineyard tastings"
    },
  ],
};

/**
 * ResultView component
 * Renders either the live AI generated itinerary or rich visual suggested plans.
 */
export function ResultView({
  tripData,
  loading,
  travelerType = 'solo',
  onSelectDay,
  onResetTrip,
  onSelectSuggestedPlan,
}) {
  const totalStops = tripData?.itinerary?.reduce(
    (acc, day) => acc + (day.stops?.length || 0),
    0
  ) || 0;

  const currentSuggestions = FEATURED_PLANS[travelerType] || FEATURED_PLANS.solo;

  return (
    <>
      {/* Trip Overview Banner (Shown when an AI plan is active) */}
      {tripData && (
        <div className="trip-overview-banner">
          <div className="trip-overview-left">
            <span className="overview-icon">🎯</span>
            <div>
              <h3 className="overview-destination">{tripData.destination}</h3>
              <p className="overview-details">
                {tripData.itinerary?.length} Days • {totalStops} Total Activities
              </p>
            </div>
          </div>
          <button className="btn-chip btn-reset" onClick={onResetTrip} type="button">
            🔄 Plan Another Trip
          </button>
        </div>
      )}

      {/* Main Section Container */}
      <main className="section-container">
        <div className="section-header">
          <div>
            <div className="section-badge-row">
              <span className="section-type-pill">
                {tripData ? "✨ GENERATED PLAN" : (travelerType === 'group' ? "👥 GROUP INSPIRATION" : "🎒 SOLO INSPIRATION")}
              </span>
            </div>
            <h2 className="section-title">
              {tripData ? "YOUR CUSTOM ITINERARY" : "POPULAR SUGGESTED PLANS"}
            </h2>
            <p className="section-subtitle">
              {tripData
                ? `Detailed schedule for ${tripData.destination}. Click any card to review, reorder, or customize stops.`
                : `Explore popular handpicked ${travelerType === 'group' ? 'group getaways' : 'solo trips'}. Click any card to generate the full AI schedule instantly.`}
            </p>
          </div>
          {tripData && (
            <span className="days-badge">
              {tripData.itinerary?.length} Days Generated
            </span>
          )}
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {loading ? (
            <LoadingState count={4} />
          ) : tripData?.itinerary ? (
            /* Generated Itinerary Daily Cards */
            tripData.itinerary.map((day, idx) => (
              <div
                key={day.day_number || idx}
                className="itinerary-card"
                onClick={() => onSelectDay(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDay(idx);
                  }
                }}
              >
                <div className="card-header">
                  <span className="day-badge">Day {day.day_number}</span>
                  <span className="stops-count-badge">
                    {day.stops.length} {day.stops.length === 1 ? 'Stop' : 'Stops'}
                  </span>
                </div>

                <div className="card-main">
                  <h3 className="card-title">{day.theme}</h3>
                  <div className="card-stops-preview">
                    {day.stops.slice(0, 2).map((s, sIdx) => (
                      <div key={s.id || sIdx} className="preview-stop-row">
                        <span className="preview-bullet">•</span>
                        <span className="preview-time">{s.time}:</span>
                        <span className="preview-loc">{s.location}</span>
                      </div>
                    ))}
                    {day.stops.length > 2 && (
                      <div className="preview-more">
                        +{day.stops.length - 2} more activities...
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(idx);
                    }}
                    type="button"
                  >
                    <span>View & Edit Schedule</span>
                    <span className="btn-view-arrow">→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* Attractive Suggested Plan Cards with Destination Photos */
            currentSuggestions.map((plan) => (
              <div
                key={plan.id}
                className="suggested-plan-card"
                onClick={() => onSelectSuggestedPlan && onSelectSuggestedPlan(plan.prompt)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectSuggestedPlan) onSelectSuggestedPlan(plan.prompt);
                  }
                }}
              >
                {/* Visual Image Header */}
                <div className="suggested-img-container">
                  <img
                    src={plan.image}
                    alt={plan.destination}
                    className="suggested-card-img"
                    loading="lazy"
                  />
                  <div className="suggested-img-overlay"></div>
                  <div className="suggested-img-badges">
                    <span className="suggested-dest-pill">📍 {plan.destination}</span>
                    <span className="suggested-duration-pill">{plan.duration}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="suggested-card-body">
                  <h3 className="suggested-card-title">{plan.title}</h3>
                  <p className="suggested-card-desc">{plan.desc}</p>

                  {/* Highlight Tags */}
                  <div className="suggested-tags-row">
                    {plan.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="suggested-tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="suggested-card-footer">
                  <button
                    className="btn-suggested-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSuggestedPlan) onSelectSuggestedPlan(plan.prompt);
                    }}
                    type="button"
                  >
                    <span>Build This Itinerary</span>
                    <span className="btn-action-arrow">→</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
