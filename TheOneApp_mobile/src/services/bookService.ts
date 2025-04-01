/**
 * Service to manage book data using pre-fetched content
 * 
 * This service loads book navigation data from scraped-navigation.json
 * and provides methods to access volumes, books, chapters, and content.
 */

import { Volume, Book, Chapter, BookContent } from '../types/book';
import * as FileSystem from 'expo-file-system';

/**
 * Clean title by removing unwanted suffixes and formatting
 */
function cleanTitle(title: string): string {
  if (!title) return '';
  
  // Remove "Expand" text if present (common in volume titles)
  let cleanedTitle = title.replace(/Expand$/i, '').trim();
  
  // Remove any trailing pipe characters and trim
  cleanedTitle = cleanedTitle.replace(/\s*\|\s*$/, '').trim();
  
  // Remove "Print Book" or "eBook" suffixes that might be in chapter titles
  cleanedTitle = cleanedTitle.replace(/\s*\|\s*(Print Book|eBook)$/, '').trim();
  
  return cleanedTitle;
}

/**
 * Extract ID from URL
 */
function extractIdFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Extract the last part of the URL (the chapter ID)
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    return pathParts[pathParts.length - 1] || '';
  } catch (error) {
    // Fallback for invalid URLs
    console.warn(`Invalid URL format: ${url}`);
    const parts = url.split('/').filter(part => part.length > 0);
    return parts[parts.length - 1] || '';
  }
}

// Import navigation data
// Note: This will be populated after running the sync-book-data.mjs script
let navigationData: Volume[] = [];

try {
  // Dynamic import to handle the case where the file might not exist yet
  // Use scraped-navigation.json which is the same file used by the web app
  const importedData = require('../data/book/scraped-navigation.json');
  
  if (Array.isArray(importedData)) {
    navigationData = importedData;
    
    // Clean up volume titles (remove "Expand" suffix)
    navigationData = navigationData.map(volume => ({
      ...volume,
      title: cleanTitle(volume.title)
    }));
    
    // Log navigation data for debugging
    console.log('Navigation data loaded:', 
      `Volumes: ${navigationData.length}, ` +
      `First volume books: ${navigationData[0]?.books?.length || 0}`
    );
    
    // Log detailed information about each volume and book
    navigationData.forEach((volume, vIndex) => {
      console.log(`Volume ${vIndex + 1}: ${volume.title} - ${volume.books.length} books`);
      volume.books.forEach((book, bIndex) => {
        console.log(`  Book ${bIndex + 1}: ${book.title} - ${book.chapters.length} chapters`);
      });
    });
  } else {
    console.error('Imported navigation data is not an array:', importedData);
    navigationData = [];
  }
} catch (error) {
  console.warn('Book navigation data not found. Run sync-book-data.mjs to populate.');
  console.error('Error details:', error);
  navigationData = [];
}

// Static import map - each file is imported with a hardcoded path
// This avoids using dynamic requires which aren't supported by Metro bundler
const contentImports: Record<string, BookContent> = {
  'a-new-message-of-hope': require('../data/book/content/a-new-message-of-hope.json'),
  'achievement': require('../data/book/content/achievement.json'),
  'achieving-peace': require('../data/book/content/achieving-peace.json'),
  'adapting-to-a-changing-world': require('../data/book/content/adapting-to-a-changing-world.json'),
  'ambition-personal-true-way': require('../data/book/content/ambition-personal-true-way.json'),
  'approaching-the-new-message': require('../data/book/content/approaching-the-new-message.json'),
  'avoiding-disaster': require('../data/book/content/avoiding-disaster.json'),
  'battleground-conflict-war': require('../data/book/content/battleground-conflict-war.json'),
  'becoming-wise-wisdom': require('../data/book/content/becoming-wise-wisdom.json'),
  'beginning-preparation-respond-calling': require('../data/book/content/beginning-preparation-respond-calling.json'),
  'being-a-person-of-the-new-message': require('../data/book/content/being-a-person-of-the-new-message.json'),
  'being-a-student-of-the-new-message': require('../data/book/content/being-a-student-of-the-new-message.json'),
  'being-alone': require('../data/book/content/being-alone.json'),
  'being-centered-crashing-world': require('../data/book/content/being-centered-crashing-world.json'),
  'being-present-still-mind': require('../data/book/content/being-present-still-mind.json'),
  'beneath-surface': require('../data/book/content/beneath-surface.json'),
  'beyond-human-religion': require('../data/book/content/beyond-human-religion.json'),
  'bridge-two-minds': require('../data/book/content/bridge-two-minds.json'),
  'bringing-balance-and-security-to-the-world': require('../data/book/content/bringing-balance-and-security-to-the-world.json'),
  'bringing-the-new-message-to-the-world': require('../data/book/content/bringing-the-new-message-to-the-world.json'),
  'buddha-and-the-new-message-from-god': require('../data/book/content/buddha-and-the-new-message-from-god.json'),
  'building-spiritual-community': require('../data/book/content/building-spiritual-community.json'),
  'building-strength-resilience': require('../data/book/content/building-strength-resilience.json'),
  'building-the-bridge-to-a-new-life': require('../data/book/content/building-the-bridge-to-a-new-life.json'),
  'building-your-ark': require('../data/book/content/building-your-ark.json'),
  'burden-of-the-messenger': require('../data/book/content/burden-of-the-messenger.json'),
  'compassion-means': require('../data/book/content/compassion-means.json'),
  'completing-relationships-when-over': require('../data/book/content/completing-relationships-when-over.json'),
  'comprehending-god': require('../data/book/content/comprehending-god.json'),
  'concentrated-mind': require('../data/book/content/concentrated-mind.json'),
  'courage-and-the-will-to-prepare': require('../data/book/content/courage-and-the-will-to-prepare.json'),
  'courage-face-yourself': require('../data/book/content/courage-face-yourself.json'),
  'dealing-with-resistance-and-hostility': require('../data/book/content/dealing-with-resistance-and-hostility.json'),
  'deep-union-god': require('../data/book/content/deep-union-god.json'),
  'deepening-your-spiritual-practice': require('../data/book/content/deepening-your-spiritual-practice.json'),
  'deeper-connection-relationships': require('../data/book/content/deeper-connection-relationships.json'),
  'desire-freedom': require('../data/book/content/desire-freedom.json'),
  'destiny': require('../data/book/content/destiny.json'),
  'develop-greater-concentration': require('../data/book/content/develop-greater-concentration.json'),
  'developing-strength-wisdom': require('../data/book/content/developing-strength-wisdom.json'),
  'disappointment': require('../data/book/content/disappointment.json'),
  'discernment-how-to-see': require('../data/book/content/discernment-how-to-see.json'),
  'discernment-in-relationships': require('../data/book/content/discernment-in-relationships.json'),
  'end-war-human-unity': require('../data/book/content/end-war-human-unity.json'),
  'enduring-happiness': require('../data/book/content/enduring-happiness.json'),
  'enduring-love': require('../data/book/content/enduring-love.json'),
  'enemies-human-family': require('../data/book/content/enemies-human-family.json'),
  'escaping-fear-confusion-and-hopelessness': require('../data/book/content/escaping-fear-confusion-and-hopelessness.json'),
  'escaping-fear': require('../data/book/content/escaping-fear.json'),
  'escaping-the-past': require('../data/book/content/escaping-the-past.json'),
  'essential-relationships-others': require('../data/book/content/essential-relationships-others.json'),
  'essential-truths-other-forms-life': require('../data/book/content/essential-truths-other-forms-life.json'),
  'establishing-meaningful-relationships': require('../data/book/content/establishing-meaningful-relationships.json'),
  'experience-relationship-conclusion': require('../data/book/content/experience-relationship-conclusion.json'),
  'experiencing-god': require('../data/book/content/experiencing-god.json'),
  'experiencing-presence-god': require('../data/book/content/experiencing-presence-god.json'),
  'experiencing-your-higher-purpose': require('../data/book/content/experiencing-your-higher-purpose.json'),
  'extraterrestrial-encounters': require('../data/book/content/extraterrestrial-encounters.json'),
  'extraterrestrial-technology': require('../data/book/content/extraterrestrial-technology.json'),
  'facing-a-world-in-decline': require('../data/book/content/facing-a-world-in-decline.json'),
  'facing-great-change-in-the-world': require('../data/book/content/facing-great-change-in-the-world.json'),
  'facing-light-revelation': require('../data/book/content/facing-light-revelation.json'),
  'facing-pandemic-today': require('../data/book/content/facing-pandemic-today.json'),
  'faith-fear-idea-self': require('../data/book/content/faith-fear-idea-self.json'),
  'faith-work-and-higher-purpose': require('../data/book/content/faith-work-and-higher-purpose.json'),
  'false-expectations-of-god': require('../data/book/content/false-expectations-of-god.json'),
  'financial-storms': require('../data/book/content/financial-storms.json'),
  'finding-certainty-and-strength': require('../data/book/content/finding-certainty-and-strength.json'),
  'finding-knowledge-spiritual-nature': require('../data/book/content/finding-knowledge-spiritual-nature.json'),
  'first-commitment-relationship-god': require('../data/book/content/first-commitment-relationship-god.json'),
  'following-presence-god': require('../data/book/content/following-presence-god.json'),
  'food-water-and-energy': require('../data/book/content/food-water-and-energy.json'),
  'forces-good': require('../data/book/content/forces-good.json'),
  'foreign-powers-beyond-world': require('../data/book/content/foreign-powers-beyond-world.json'),
  'forgiveness': require('../data/book/content/forgiveness.json'),
  'foundation-greater-life-strength': require('../data/book/content/foundation-greater-life-strength.json'),
  'free-energy-alien-technologies': require('../data/book/content/free-energy-alien-technologies.json'),
  'freedom-journey': require('../data/book/content/freedom-journey.json'),
  'freedom': require('../data/book/content/freedom.json'),
  'fulfillment': require('../data/book/content/fulfillment.json'),
  'future-humanity': require('../data/book/content/future-humanity.json'),
  'gaining-strength-inner-authority': require('../data/book/content/gaining-strength-inner-authority.json'),
  'genetic-manipulation-humans': require('../data/book/content/genetic-manipulation-humans.json'),
  'giving-i': require('../data/book/content/giving-i.json'),
  'giving-ii': require('../data/book/content/giving-ii.json'),
  'global-security-facing-reality': require('../data/book/content/global-security-facing-reality.json'),
  'god-has-spoken': require('../data/book/content/god-has-spoken.json'),
  'god-is-moving-humanity-in-a-new-direction': require('../data/book/content/god-is-moving-humanity-in-a-new-direction.json'),
  'god-is-moving-humanity': require('../data/book/content/god-is-moving-humanity.json'),
  'god-knowledge-and-the-angelic-presence': require('../data/book/content/god-knowledge-and-the-angelic-presence.json'),
  'gods-ancient-covenant-with-humanity': require('../data/book/content/gods-ancient-covenant-with-humanity.json'),
  'gods-new-message-for-political-leaders': require('../data/book/content/gods-new-message-for-political-leaders.json'),
  'gods-new-message-for-the-islamic-world': require('../data/book/content/gods-new-message-for-the-islamic-world.json'),
  'gods-new-message-for-the-world': require('../data/book/content/gods-new-message-for-the-world.json'),
  'gods-new-message-for-the-worlds-religions': require('../data/book/content/gods-new-message-for-the-worlds-religions.json'),
  'gods-plan-for-the-world': require('../data/book/content/gods-plan-for-the-world.json'),
  'gods-plan-save-everyone': require('../data/book/content/gods-plan-save-everyone.json'),
  'gods-power-in-you': require('../data/book/content/gods-power-in-you.json'),
  'going-beneath-the-surface-of-the-mind': require('../data/book/content/going-beneath-the-surface-of-the-mind.json'),
  'grace': require('../data/book/content/grace.json'),
  'great-attraction': require('../data/book/content/great-attraction.json'),
  'great-challenge-become-aware': require('../data/book/content/great-challenge-become-aware.json'),
  'great-relationships-destiny': require('../data/book/content/great-relationships-destiny.json'),
  'great-transition-one-world-community': require('../data/book/content/great-transition-one-world-community.json'),
  'great-truth-god': require('../data/book/content/great-truth-god.json'),
  'greater-community-reality': require('../data/book/content/greater-community-reality.json'),
  'greater-honesty-mind': require('../data/book/content/greater-honesty-mind.json'),
  'greater-intelligence': require('../data/book/content/greater-intelligence.json'),
  'greater-pleasure': require('../data/book/content/greater-pleasure.json'),
  'greater-power': require('../data/book/content/greater-power.json'),
  'greater-purpose-life': require('../data/book/content/greater-purpose-life.json'),
  'greater-work-pillar': require('../data/book/content/greater-work-pillar.json'),
  'group-mind': require('../data/book/content/group-mind.json'),
  'guidelines-for-discovering-your-higher-purpose': require('../data/book/content/guidelines-for-discovering-your-higher-purpose.json'),
  'guidelines-for-preparing-for-the-greater-community': require('../data/book/content/guidelines-for-preparing-for-the-greater-community.json'),
  'happiness-in-the-world': require('../data/book/content/happiness-in-the-world.json'),
  'harmful-influences': require('../data/book/content/harmful-influences.json'),
  'healing-relationships-past': require('../data/book/content/healing-relationships-past.json'),
  'healing': require('../data/book/content/healing.json'),
  'health': require('../data/book/content/health.json'),
  'heaven-and-hell': require('../data/book/content/heaven-and-hell.json'),
  'here-unique-contribution': require('../data/book/content/here-unique-contribution.json'),
  'higher-vantage-point': require('../data/book/content/higher-vantage-point.json'),
  'honesty-present-mind': require('../data/book/content/honesty-present-mind.json'),
  'how-do-you-prepare': require('../data/book/content/how-do-you-prepare.json'),
  'how-does-revelation-occur-in-human-life': require('../data/book/content/how-does-revelation-occur-in-human-life.json'),
  'how-god-speaks-to-the-world': require('../data/book/content/how-god-speaks-to-the-world.json'),
  'how-is-knowledge-translated-in-the-greater-community': require('../data/book/content/how-is-knowledge-translated-in-the-greater-community.json'),
  'how-is-wisdom-achieved-in-life': require('../data/book/content/how-is-wisdom-achieved-in-life.json'),
  'how-to-live': require('../data/book/content/how-to-live.json'),
  'how-to-regard-the-messenger': require('../data/book/content/how-to-regard-the-messenger.json'),
  'human-isolation-over': require('../data/book/content/human-isolation-over.json'),
  'human-unity': require('../data/book/content/human-unity.json'),
  'humanitys-destiny-in-the-greater-community': require('../data/book/content/humanitys-destiny-in-the-greater-community.json'),
  'humanitys-emergence-into-the-greater-community': require('../data/book/content/humanitys-emergence-into-the-greater-community.json'),
  'ideas-beliefs-god': require('../data/book/content/ideas-beliefs-god.json'),
  'illness-and-healing': require('../data/book/content/illness-and-healing.json'),
  'importance-greater-community': require('../data/book/content/importance-greater-community.json'),
  'individual-freedom': require('../data/book/content/individual-freedom.json'),
  'inner-listening': require('../data/book/content/inner-listening.json'),
  'intelligent-life-in-the-universe': require('../data/book/content/intelligent-life-in-the-universe.json'),
  'intelligent-life-universe': require('../data/book/content/intelligent-life-universe.json'),
  'interdependence': require('../data/book/content/interdependence.json'),
  'interstellar-trade': require('../data/book/content/interstellar-trade.json'),
  'jesus-and-the-new-message': require('../data/book/content/jesus-and-the-new-message.json'),
  'joy-gratitude': require('../data/book/content/joy-gratitude.json'),
  'kindness-is-acceptance-understanding': require('../data/book/content/kindness-is-acceptance-understanding.json'),
  'know-what-to-do': require('../data/book/content/know-what-to-do.json'),
  'lamp': require('../data/book/content/lamp.json'),
  'learn-others-want-learn': require('../data/book/content/learn-others-want-learn.json'),
  'life-beyond-solar-system': require('../data/book/content/life-beyond-solar-system.json'),
  'life-beyond': require('../data/book/content/life-beyond.json'),
  'lineage-messenger': require('../data/book/content/lineage-messenger.json'),
  'living-at-a-time-of-revelation': require('../data/book/content/living-at-a-time-of-revelation.json'),
  'living-in-a-time-of-uncertainty-and-instability': require('../data/book/content/living-in-a-time-of-uncertainty-and-instability.json'),
  'living-in-an-emerging-world': require('../data/book/content/living-in-an-emerging-world.json'),
  'living-separation-alone-afraid': require('../data/book/content/living-separation-alone-afraid.json'),
  'love-and-relationships': require('../data/book/content/love-and-relationships.json'),
  'love': require('../data/book/content/love.json'),
  'maintaining-relationships-spiritual': require('../data/book/content/maintaining-relationships-spiritual.json'),
  'marriage-and-higher-purpose': require('../data/book/content/marriage-and-higher-purpose.json'),
  'marriage-consummate-relationship-devotion': require('../data/book/content/marriage-consummate-relationship-devotion.json'),
  'marriage': require('../data/book/content/marriage.json'),
  'mastery': require('../data/book/content/mastery.json'),
  'meaning-spiritual-development': require('../data/book/content/meaning-spiritual-development.json'),
  'message-young-people': require('../data/book/content/message-young-people.json'),
  'mission-of-the-messenger': require('../data/book/content/mission-of-the-messenger.json'),
  'money-resource-relationship': require('../data/book/content/money-resource-relationship.json'),
  'muhammad-and-the-nm': require('../data/book/content/muhammad-and-the-nm.json'),
  'my-role-greater-purpose': require('../data/book/content/my-role-greater-purpose.json'),
  'natural-environment': require('../data/book/content/natural-environment.json'),
  'nature-and-natural-disasters': require('../data/book/content/nature-and-natural-disasters.json'),
  'navigating-difficult-times-ahead': require('../data/book/content/navigating-difficult-times-ahead.json'),
  'new-god-revelation': require('../data/book/content/new-god-revelation.json'),
  'new-world-prophecy': require('../data/book/content/new-world-prophecy.json'),
  'new-world': require('../data/book/content/new-world.json'),
  'not-worry-future': require('../data/book/content/not-worry-future.json'),
  'origin-messenger': require('../data/book/content/origin-messenger.json'),
  'other-worlds-reality': require('../data/book/content/other-worlds-reality.json'),
  'perseverance-give-yourself': require('../data/book/content/perseverance-give-yourself.json'),
  'personal-development': require('../data/book/content/personal-development.json'),
  'personal-freedom': require('../data/book/content/personal-freedom.json'),
  'personal-revelation': require('../data/book/content/personal-revelation.json'),
  'personal-side-develop-trust': require('../data/book/content/personal-side-develop-trust.json'),
  'physical-universe': require('../data/book/content/physical-universe.json'),
  'planetary-instability': require('../data/book/content/planetary-instability.json'),
  'plight-humanity-waves-change': require('../data/book/content/plight-humanity-waves-change.json'),
  'possessions': require('../data/book/content/possessions.json'),
  'poverty': require('../data/book/content/poverty.json'),
  'power-and-responsibility': require('../data/book/content/power-and-responsibility.json'),
  'power-knowledge': require('../data/book/content/power-knowledge.json'),
  'power-of-knowledge-other': require('../data/book/content/power-of-knowledge-other.json'),
  'power-persuasion': require('../data/book/content/power-persuasion.json'),
  'preception-interpretation-reality': require('../data/book/content/preception-interpretation-reality.json'),
  'preparing-for-the-future-2': require('../data/book/content/preparing-for-the-future-2.json'),
  'preparing-for-the-future': require('../data/book/content/preparing-for-the-future.json'),
  'preparing-for-the-greater-community': require('../data/book/content/preparing-for-the-greater-community.json'),
  'preparing-your-family': require('../data/book/content/preparing-your-family.json'),
  'preventing-collapse-wars-of-desperation': require('../data/book/content/preventing-collapse-wars-of-desperation.json'),
  'pride': require('../data/book/content/pride.json'),
  'prison-escape-your-mind': require('../data/book/content/prison-escape-your-mind.json'),
  'problem-evil': require('../data/book/content/problem-evil.json'),
  'problem-sin-power-redemption': require('../data/book/content/problem-sin-power-redemption.json'),
  'problem-suffering-greater-happiness': require('../data/book/content/problem-suffering-greater-happiness.json'),
  'protecting-the-message-and-the-messenger': require('../data/book/content/protecting-the-message-and-the-messenger.json'),
  'protecting-the-world': require('../data/book/content/protecting-the-world.json'),
  'protecting-yourself-from-the-intervention': require('../data/book/content/protecting-yourself-from-the-intervention.json'),
  'provoking-change': require('../data/book/content/provoking-change.json'),
  'raising-children': require('../data/book/content/raising-children.json'),
  'real-change': require('../data/book/content/real-change.json'),
  'realizing-the-need-to-prepare': require('../data/book/content/realizing-the-need-to-prepare.json'),
  'relationship-god-unknown': require('../data/book/content/relationship-god-unknown.json'),
  'relationships-and-sexuality': require('../data/book/content/relationships-and-sexuality.json'),
  'relationships-and-the-great-waves': require('../data/book/content/relationships-and-the-great-waves.json'),
  'relationships-of-destiny': require('../data/book/content/relationships-of-destiny.json'),
  'religion-and-politics': require('../data/book/content/religion-and-politics.json'),
  'religion-as-education': require('../data/book/content/religion-as-education.json'),
  'religion-as-mystery': require('../data/book/content/religion-as-mystery.json'),
  'religion-universe': require('../data/book/content/religion-universe.json'),
  'religious-fundamentalism': require('../data/book/content/religious-fundamentalism.json'),
  'religious-violence': require('../data/book/content/religious-violence.json'),
  'remembrance-eternal-life': require('../data/book/content/remembrance-eternal-life.json'),
  'resilience': require('../data/book/content/resilience.json'),
  'resolve-conflict-world': require('../data/book/content/resolve-conflict-world.json'),
  'responses-definition-intelligence': require('../data/book/content/responses-definition-intelligence.json'),
  'restoring-the-world': require('../data/book/content/restoring-the-world.json'),
  'seal-of-the-prophets': require('../data/book/content/seal-of-the-prophets.json'),
  'seeing-knowing-and-taking-action': require('../data/book/content/seeing-knowing-and-taking-action.json'),
  'seeing-what-is-coming': require('../data/book/content/seeing-what-is-coming.json'),
  'self-confidence': require('../data/book/content/self-confidence.json'),
  'self-expression-the-mental-environment': require('../data/book/content/self-expression-the-mental-environment.json'),
  'self-reliance': require('../data/book/content/self-reliance.json'),
  'serve-others': require('../data/book/content/serve-others.json'),
  'service-in-the-world': require('../data/book/content/service-in-the-world.json'),
  'sexuality-power-purpose': require('../data/book/content/sexuality-power-purpose.json'),
  'sharing-the-way-of-knowledge-with-others': require('../data/book/content/sharing-the-way-of-knowledge-with-others.json'),
  'signs-from-the-world': require('../data/book/content/signs-from-the-world.json'),
  'simplicity': require('../data/book/content/simplicity.json'),
  'solving-problems': require('../data/book/content/solving-problems.json'),
  'souls-journey-through-life': require('../data/book/content/souls-journey-through-life.json'),
  'space-travel': require('../data/book/content/space-travel.json'),
  'spiritual-community-true-community': require('../data/book/content/spiritual-community-true-community.json'),
  'spiritual-development-practices': require('../data/book/content/spiritual-development-practices.json'),
  'spiritual-families': require('../data/book/content/spiritual-families.json'),
  'spiritual-family-2': require('../data/book/content/spiritual-family-2.json'),
  'spiritual-family': require('../data/book/content/spiritual-family.json'),
  'spiritual-practice-find-purpose': require('../data/book/content/spiritual-practice-find-purpose.json'),
  'spiritual-retreat': require('../data/book/content/spiritual-retreat.json'),
  'spiritual-revolution': require('../data/book/content/spiritual-revolution.json'),
  'spiritual-truths': require('../data/book/content/spiritual-truths.json'),
  'stability-security': require('../data/book/content/stability-security.json'),
  'stages-development-relationship': require('../data/book/content/stages-development-relationship.json'),
  'standing-precipice-world-decline': require('../data/book/content/standing-precipice-world-decline.json'),
  'steps-knowledge-chapter': require('../data/book/content/steps-knowledge-chapter.json'),
  'steps-knowledge-continuation-training-chapter': require('../data/book/content/steps-knowledge-continuation-training-chapter.json'),
  'stillness': require('../data/book/content/stillness.json'),
  'suffering': require('../data/book/content/suffering.json'),
  'sufficient-health': require('../data/book/content/sufficient-health.json'),
  'supporting-gods-new-revelation': require('../data/book/content/supporting-gods-new-revelation.json'),
  'taking-the-steps-to-knowledge': require('../data/book/content/taking-the-steps-to-knowledge.json'),
  'the-age-of-women': require('../data/book/content/the-age-of-women.json'),
  'the-art-of-seeing': require('../data/book/content/the-art-of-seeing.json'),
  'the-assembly': require('../data/book/content/the-assembly.json'),
  'the-awakening': require('../data/book/content/the-awakening.json'),
  'the-blessing': require('../data/book/content/the-blessing.json'),
  'the-calling': require('../data/book/content/the-calling.json'),
  'the-condition-of-the-world': require('../data/book/content/the-condition-of-the-world.json'),
  'the-confirmation': require('../data/book/content/the-confirmation.json'),
  'the-consequence-of-revelation': require('../data/book/content/the-consequence-of-revelation.json'),
  'the-crisis': require('../data/book/content/the-crisis.json'),
  'the-danger-of-isolation': require('../data/book/content/the-danger-of-isolation.json'),
  'the-deep-evaluation': require('../data/book/content/the-deep-evaluation.json'),
  'the-determination': require('../data/book/content/the-determination.json'),
  'the-effects-of-the-pacification-program': require('../data/book/content/the-effects-of-the-pacification-program.json'),
  'the-engagement': require('../data/book/content/the-engagement.json'),
  'the-engine-of-war': require('../data/book/content/the-engine-of-war.json'),
  'the-fate-of-nations': require('../data/book/content/the-fate-of-nations.json'),
  'the-four-pillars-of-life': require('../data/book/content/the-four-pillars-of-life.json'),
  'the-freedom-to-move-with-knowledge': require('../data/book/content/the-freedom-to-move-with-knowledge.json'),
  'the-gift-of-a-new-life': require('../data/book/content/the-gift-of-a-new-life.json'),
  'the-global-emergency': require('../data/book/content/the-global-emergency.json'),
  'the-goal-and-purpose-of-the-revelation': require('../data/book/content/the-goal-and-purpose-of-the-revelation.json'),
  'the-great-faith': require('../data/book/content/the-great-faith.json'),
  'the-great-love': require('../data/book/content/the-great-love.json'),
  'the-great-threshold': require('../data/book/content/the-great-threshold.json'),
  'the-great-turning-point-for-humanity': require('../data/book/content/the-great-turning-point-for-humanity.json'),
  'the-great-warning': require('../data/book/content/the-great-warning.json'),
  'the-great-waves-and-the-hidden-reality-of-contact': require('../data/book/content/the-great-waves-and-the-hidden-reality-of-contact.json'),
  'the-great-waves-and-your-life': require('../data/book/content/the-great-waves-and-your-life.json'),
  'the-great-waves-of-change-vol5': require('../data/book/content/the-great-waves-of-change-vol5.json'),
  'the-great-waves-of-change': require('../data/book/content/the-great-waves-of-change.json'),
  'the-great-waves-prophecy': require('../data/book/content/the-great-waves-prophecy.json'),
  'the-greater-community-chapter-3': require('../data/book/content/the-greater-community-chapter-3.json'),
  'the-greater-intelligence': require('../data/book/content/the-greater-intelligence.json'),
  'the-greater-mind-of-knowledge': require('../data/book/content/the-greater-mind-of-knowledge.json'),
  'the-greater-religion': require('../data/book/content/the-greater-religion.json'),
  'the-guardians': require('../data/book/content/the-guardians.json'),
  'the-heart-of-god': require('../data/book/content/the-heart-of-god.json'),
  'the-holy-days': require('../data/book/content/the-holy-days.json'),
  'the-illumination': require('../data/book/content/the-illumination.json'),
  'the-importance-of-the-individual': require('../data/book/content/the-importance-of-the-individual.json'),
  'the-initiation': require('../data/book/content/the-initiation.json'),
  'the-inner-voice': require('../data/book/content/the-inner-voice.json'),
  'the-journey-of-the-messenger': require('../data/book/content/the-journey-of-the-messenger.json'),
  'the-journey-to-a-new-life': require('../data/book/content/the-journey-to-a-new-life.json'),
  'the-meaning-of-christmas': require('../data/book/content/the-meaning-of-christmas.json'),
  'the-message-and-the-messenger': require('../data/book/content/the-message-and-the-messenger.json'),
  'the-messengers-calling': require('../data/book/content/the-messengers-calling.json'),
  'the-miracle': require('../data/book/content/the-miracle.json'),
  'the-mysterious-path-of-revelation': require('../data/book/content/the-mysterious-path-of-revelation.json'),
  'the-new-god-experience-vol2': require('../data/book/content/the-new-god-experience-vol2.json'),
  'the-new-god-experience': require('../data/book/content/the-new-god-experience.json'),
  'the-new-message-for-the-impoverished-and-oppressed': require('../data/book/content/the-new-message-for-the-impoverished-and-oppressed.json'),
  'the-new-messenger-chapter-1': require('../data/book/content/the-new-messenger-chapter-1.json'),
  'the-new-way-forward-for-humanity': require('../data/book/content/the-new-way-forward-for-humanity.json'),
  'the-night-meditation': require('../data/book/content/the-night-meditation.json'),
  'the-one-god-chapter-2': require('../data/book/content/the-one-god-chapter-2.json'),
  'the-one-god-chapter-3': require('../data/book/content/the-one-god-chapter-3.json'),
  'the-one-god-english-ebook': require('../data/book/content/the-one-god-english-ebook.json'),
  'the-one-god-english-print-book': require('../data/book/content/the-one-god-english-print-book.json'),
  'the-origin': require('../data/book/content/the-origin.json'),
  'the-pilgrimage': require('../data/book/content/the-pilgrimage.json'),
  'the-power-of-seeing-and-knowing': require('../data/book/content/the-power-of-seeing-and-knowing.json'),
  'the-problem-of-human-denial': require('../data/book/content/the-problem-of-human-denial.json'),
  'the-proclamation': require('../data/book/content/the-proclamation.json'),
  'the-prophet': require('../data/book/content/the-prophet.json'),
  'the-pure-religion': require('../data/book/content/the-pure-religion.json'),
  'the-purpose-of-religion': require('../data/book/content/the-purpose-of-religion.json'),
  'the-race-to-save-human-civilization': require('../data/book/content/the-race-to-save-human-civilization.json'),
  'the-rays-of-initiation': require('../data/book/content/the-rays-of-initiation.json'),
  'the-recitation': require('../data/book/content/the-recitation.json'),
  'the-reconciliation': require('../data/book/content/the-reconciliation.json'),
  'the-redeemer': require('../data/book/content/the-redeemer.json'),
  'the-reformation': require('../data/book/content/the-reformation.json'),
  'the-requirements-of-the-messenger': require('../data/book/content/the-requirements-of-the-messenger.json'),
  'the-sacred-life': require('../data/book/content/the-sacred-life.json'),
  'the-sacred-rendezvous': require('../data/book/content/the-sacred-rendezvous.json'),
  'the-sacred': require('../data/book/content/the-sacred.json'),
  'the-separation': require('../data/book/content/the-separation.json'),
  'the-ship': require('../data/book/content/the-ship.json'),
  'the-shock-of-the-future': require('../data/book/content/the-shock-of-the-future.json'),
  'the-soul': require('../data/book/content/the-soul.json'),
  'the-spiritual-fire': require('../data/book/content/the-spiritual-fire.json'),
  'the-still-mind': require('../data/book/content/the-still-mind.json'),
  'the-story-of-the-messenger': require('../data/book/content/the-story-of-the-messenger.json'),
  'the-time-of-revelation': require('../data/book/content/the-time-of-revelation.json'),
  'the-turning-point': require('../data/book/content/the-turning-point.json'),
  'the-upheaval': require('../data/book/content/the-upheaval.json'),
  'the-veil-of-the-messenger': require('../data/book/content/the-veil-of-the-messenger.json'),
  'the-voice-of-the-revelation': require('../data/book/content/the-voice-of-the-revelation.json'),
  'the-will-of-heaven': require('../data/book/content/the-will-of-heaven.json'),
  'the-world-must-receive-gods-new-message': require('../data/book/content/the-world-must-receive-gods-new-message.json'),
  'the-world-must-receive': require('../data/book/content/the-world-must-receive.json'),
  'three-stages-development': require('../data/book/content/three-stages-development.json'),
  'trade-commerce-competition': require('../data/book/content/trade-commerce-competition.json'),
  'true-inspiration': require('../data/book/content/true-inspiration.json'),
  'true-self-knowledge': require('../data/book/content/true-self-knowledge.json'),
  'trusting-god': require('../data/book/content/trusting-god.json'),
  'uncertain-future': require('../data/book/content/uncertain-future.json'),
  'understanding-forgiveness': require('../data/book/content/understanding-forgiveness.json'),
  'understanding-money-wealth-and-power': require('../data/book/content/understanding-money-wealth-and-power.json'),
  'understanding-the-intervention': require('../data/book/content/understanding-the-intervention.json'),
  'understanding-the-new-messenger': require('../data/book/content/understanding-the-new-messenger.json'),
  'unseen-forces': require('../data/book/content/unseen-forces.json'),
  'using-power-good': require('../data/book/content/using-power-good.json'),
  'vision-future-world': require('../data/book/content/vision-future-world.json'),
  'walking-with-the-messenger': require('../data/book/content/walking-with-the-messenger.json'),
  'watchtower-paying-attention-world': require('../data/book/content/watchtower-paying-attention-world.json'),
  'way-knowledge-beyond-beliefs': require('../data/book/content/way-knowledge-beyond-beliefs.json'),
  'what-creates-evil': require('../data/book/content/what-creates-evil.json'),
  'what-does-discretion-mean': require('../data/book/content/what-does-discretion-mean.json'),
  'what-god-wills-for-you': require('../data/book/content/what-god-wills-for-you.json'),
  'what-happens-after-death': require('../data/book/content/what-happens-after-death.json'),
  'what-is-creation': require('../data/book/content/what-is-creation.json'),
  'what-is-discernment': require('../data/book/content/what-is-discernment.json'),
  'what-is-god': require('../data/book/content/what-is-god.json'),
  'what-is-grace': require('../data/book/content/what-is-grace.json'),
  'what-is-human-destiny': require('../data/book/content/what-is-human-destiny.json'),
  'what-is-human-purpose': require('../data/book/content/what-is-human-purpose.json'),
  'what-is-knowledge': require('../data/book/content/what-is-knowledge.json'),
  'what-is-life-force': require('../data/book/content/what-is-life-force.json'),
  'what-is-redemption': require('../data/book/content/what-is-redemption.json'),
  'what-is-religion': require('../data/book/content/what-is-religion.json'),
  'what-is-religious-education-and-who-is-it-for': require('../data/book/content/what-is-religious-education-and-who-is-it-for.json'),
  'what-is-self-doubt': require('../data/book/content/what-is-self-doubt.json'),
  'what-is-steps-to-knowledge': require('../data/book/content/what-is-steps-to-knowledge.json'),
  'what-is-the-evolution-of-religion-in-the-world': require('../data/book/content/what-is-the-evolution-of-religion-in-the-world.json'),
  'what-is-the-greater-community-way-of-knowledge': require('../data/book/content/what-is-the-greater-community-way-of-knowledge.json'),
  'what-is-the-greater-community': require('../data/book/content/what-is-the-greater-community.json'),
  'what-is-the-world': require('../data/book/content/what-is-the-world.json'),
  'what-is-your-preparation-for': require('../data/book/content/what-is-your-preparation-for.json'),
  'what-must-be-avoided': require('../data/book/content/what-must-be-avoided.json'),
  'what-must-be-unlearned': require('../data/book/content/what-must-be-unlearned.json'),
  'what-really-matters': require('../data/book/content/what-really-matters.json'),
  'what-will-change-the-world': require('../data/book/content/what-will-change-the-world.json'),
  'what-will-save-humanity': require('../data/book/content/what-will-save-humanity.json'),
  'where-can-knowledge-be-found': require('../data/book/content/where-can-knowledge-be-found.json'),
  'where-will-you-place-your-faith': require('../data/book/content/where-will-you-place-your-faith.json'),
  'who-are-the-allies-of-humanity': require('../data/book/content/who-are-the-allies-of-humanity.json'),
  'who-are-the-unseen-ones': require('../data/book/content/who-are-the-unseen-ones.json'),
  'who-can-you-trust': require('../data/book/content/who-can-you-trust.json'),
  'who-is-jesus': require('../data/book/content/who-is-jesus.json'),
  'who-is-wisdom-meant-for': require('../data/book/content/who-is-wisdom-meant-for.json'),
  'who-serves-humanity': require('../data/book/content/who-serves-humanity.json'),
  'whom-will-you-meet': require('../data/book/content/whom-will-you-meet.json'),
  'witnessing-the-revelation': require('../data/book/content/witnessing-the-revelation.json'),
  'work-spiritual-growth': require('../data/book/content/work-spiritual-growth.json'),
  'working-with-the-mind': require('../data/book/content/working-with-the-mind.json'),
  'world-evolution-global-community': require('../data/book/content/world-evolution-global-community.json'),
  'worldwide-community-gods-new-message': require('../data/book/content/worldwide-community-gods-new-message.json'),
  'you-are-not-your-mind': require('../data/book/content/you-are-not-your-mind.json'),
  'your-most-primary-relationship': require('../data/book/content/your-most-primary-relationship.json'),
  'your-purpose-and-destiny-in-a-changing-world': require('../data/book/content/your-purpose-and-destiny-in-a-changing-world.json'),
  'your-purpose-and-spiritual-calling': require('../data/book/content/your-purpose-and-spiritual-calling.json'),
  'your-relationship-with-others': require('../data/book/content/your-relationship-with-others.json'),
  'your-relationship-with-the-messenger': require('../data/book/content/your-relationship-with-the-messenger.json'),
  'your-relationship-with-the-world': require('../data/book/content/your-relationship-with-the-world.json'),
  'your-relationship-with-your-spiritual-family': require('../data/book/content/your-relationship-with-your-spiritual-family.json'),
  'your-relationship-with-yourself': require('../data/book/content/your-relationship-with-yourself.json'),
  'your-spiritual-family': require('../data/book/content/your-spiritual-family.json')
};

// Log the number of loaded content files
console.log(`Loaded ${Object.keys(contentImports).length} content files via static imports`);

// Cache for loaded content
const contentCache: Record<string, BookContent> = {};

/**
 * Load content for a chapter
 * 
 * This function tries to load content from:
 * 1. The static import map (contentImports)
 * 2. The local filesystem (FileSystem.documentDirectory)
 * 
 * It also caches content to avoid redundant file reads
 */
async function loadContent(chapterId: string): Promise<BookContent | null> {
  if (!chapterId) {
    console.warn('Attempted to load content with empty chapterId');
    return null;
  }
  
  try {
    // Check cache first
    if (contentCache[chapterId]) {
      console.log(`Using cached content for ${chapterId}`);
      return contentCache[chapterId];
    }
    
    // Try to get from static imports
    if (contentImports[chapterId]) {
      console.log(`Using static import for ${chapterId}`);
      
      // Create a deep copy to avoid reference issues
      const content = JSON.parse(JSON.stringify(contentImports[chapterId]));
      
      // Validate content structure
      if (!isValidBookContent(content)) {
        throw new Error(`Invalid content structure for ${chapterId}`);
      }
      
      // Cache the content
      contentCache[chapterId] = content;
      return content;
    }
    
    // Fallback to FileSystem
    const contentPath = `${FileSystem.documentDirectory}book/content/${chapterId}.json`;
    console.log(`Attempting to load content from filesystem: ${contentPath}`);
    
    // Check if file exists first
    const fileInfo = await FileSystem.getInfoAsync(contentPath);
    if (!fileInfo.exists) {
      console.warn(`File not found: ${contentPath}`);
      return createFallbackContent(chapterId);
    }
    
    // Read and parse the file
    const content = await FileSystem.readAsStringAsync(contentPath);
    const parsedContent = JSON.parse(content) as BookContent;
    
    // Validate content structure
    if (!isValidBookContent(parsedContent)) {
      throw new Error(`Invalid content structure for ${chapterId} from filesystem`);
    }
    
    // Cache the content
    contentCache[chapterId] = parsedContent;
    
    return parsedContent;
  } catch (error) {
    console.error(`Error loading content for ${chapterId}:`, error);
    
    // Return fallback content instead of null
    return createFallbackContent(chapterId);
  }
}

/**
 * Validate BookContent structure
 */
function isValidBookContent(content: any): content is BookContent {
  return (
    content &&
    typeof content === 'object' &&
    typeof content.title === 'string' &&
    typeof content.content === 'string' &&
    (content.audioUrl === null || typeof content.audioUrl === 'string')
  );
}

/**
 * Create fallback content for when a chapter can't be loaded
 */
function createFallbackContent(chapterId: string): BookContent {
  // Format the chapter ID to make it more readable
  const readableTitle = chapterId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: readableTitle,
    content: `<div class="chapter-content">
      <h1>${readableTitle}</h1>
      <p>The content for this chapter could not be loaded.</p>
      <p>This could be due to one of the following reasons:</p>
      <ul>
        <li>The content file is missing or corrupted</li>
        <li>There was an error processing the content</li>
        <li>The chapter ID is not recognized</li>
      </ul>
      <p>Please try again later or contact support if the issue persists.</p>
    </div>`,
    audioUrl: null,
    sourceUrl: ''
  };
}

/**
 * Get all volumes
 */
function getVolumes(): Volume[] {
  return navigationData;
}

/**
 * Get a volume by index
 */
function getVolume(index: number): Volume | null {
  return navigationData[index] || null;
}

/**
 * Get a volume by ID
 */
function getVolumeById(volumeId: string): Volume | null {
  return navigationData.find(volume => volume.id === volumeId) || null;
}

/**
 * Get a book by volume and book index
 */
function getBook(volumeIndex: number, bookIndex: number): Book | null {
  const volume = getVolume(volumeIndex);
  if (!volume) return null;
  
  return volume.books[bookIndex] || null;
}

/**
 * Get a book by volume ID and book ID
 */
function getBookById(volumeId: string, bookId: string): Book | null {
  const volume = getVolumeById(volumeId);
  if (!volume) return null;
  
  return volume.books.find(book => book.id === bookId) || null;
}

/**
 * Get a chapter by volume, book, and chapter index
 */
function getChapter(volumeIndex: number, bookIndex: number, chapterIndex: number): Chapter | null {
  const book = getBook(volumeIndex, bookIndex);
  if (!book) return null;
  
  return book.chapters[chapterIndex] || null;
}

/**
 * Get a chapter by volume ID, book ID, and chapter ID
 */
function getChapterById(volumeId: string, bookId: string, chapterId: string): Chapter | null {
  const book = getBookById(volumeId, bookId);
  if (!book) return null;
  
  return book.chapters.find(chapter => chapter.id === chapterId) || null;
}

/**
 * Find a chapter by ID
 */
function findChapterById(chapterId: string): { 
  chapter: Chapter, 
  volumeIndex: number, 
  bookIndex: number, 
  chapterIndex: number 
} | null {
  for (let volumeIndex = 0; volumeIndex < navigationData.length; volumeIndex++) {
    const volume = navigationData[volumeIndex];
    
    for (let bookIndex = 0; bookIndex < volume.books.length; bookIndex++) {
      const book = volume.books[bookIndex];
      
      for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
        const chapter = book.chapters[chapterIndex];
        const id = extractIdFromUrl(chapter.url);
        
        if (id === chapterId) {
          return { chapter, volumeIndex, bookIndex, chapterIndex };
        }
      }
    }
  }
  
  return null;
}

/**
 * Get navigation data
 */
function getNavigation(): Volume[] {
  return navigationData;
}

/**
 * Get content for a specific chapter
 */
async function getChapterContent(volumeId: string, bookId: string, chapterId: string): Promise<BookContent | null> {
  // Validate parameters
  if (!volumeId || !bookId || !chapterId) {
    console.error('Invalid parameters for getChapterContent', { volumeId, bookId, chapterId });
    return null;
  }
  
  // Verify the chapter exists in navigation
  const chapter = getChapterById(volumeId, bookId, chapterId);
  if (!chapter) {
    console.error(`Chapter not found in navigation: ${chapterId}`);
    return createFallbackContent(chapterId);
  }
  
  // Load the content
  try {
    const content = await loadContent(chapterId);
    return content;
  } catch (error) {
    console.error(`Error in getChapterContent for ${chapterId}:`, error);
    return createFallbackContent(chapterId);
  }
}

export default {
  getVolumes,
  getVolume,
  getVolumeById,
  getBook,
  getBookById,
  getChapter,
  getChapterById,
  findChapterById,
  loadContent,
  getNavigation,
  getChapterContent
};
