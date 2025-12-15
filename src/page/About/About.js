import React from 'react';
import './About.css';
import AboutFirstBanner from '../../Components/AboutFirstBanner/AboutFirstBanner';
import AboutSecondBanner from '../../Components/AboutSecondBanner/AboutSecondBanner';
import AboutBrandStory from '../../Components/AboutBrandStory/AboutBrandStory';
import AboutOppurtunity from '../../Components/AboutOppurtunity/AboutOppurtunity';

const About = () => {
  return (
    <div>
      <AboutFirstBanner></AboutFirstBanner>
      <AboutSecondBanner></AboutSecondBanner>
      <AboutBrandStory></AboutBrandStory>
      <AboutOppurtunity></AboutOppurtunity>
    </div>
  );
};

export default About;
