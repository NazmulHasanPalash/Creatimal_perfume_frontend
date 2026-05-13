import React from 'react';

import './Home.css';
import FirstHomePageBanner from './FirstHomePageBanner/FirstHomePageBanner';
import Category from '../../Components/Category/Category';
import FreshAroma from '../../Components/FreshAroma/FreshAroma';
import Features from '../../Components/Features/Features';
import DisplayProducts from '../../Components/DisplayProducts/DisplayProducts';

const Home = () => {
  return (
    <div>
      <FirstHomePageBanner></FirstHomePageBanner>
      <Category></Category>
      <DisplayProducts></DisplayProducts>
      <FreshAroma></FreshAroma>
      <Features></Features>
      
    </div>
  );
};

export default Home;
