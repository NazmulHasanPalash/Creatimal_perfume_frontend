import React from 'react';

import './Home.css';
import FirstHomePageBanner from './FirstHomePageBanner/FirstHomePageBanner';
import Category from '../../Components/Category/Category';
import SubAboutSection from '../../Components/SubAboutSection/SubAboutSection';
import BestProducts from '../../Components/BestProducts/BestProducts';
import FreshAroma from '../../Components/FreshAroma/FreshAroma';
import Features from '../../Components/Features/Features';
import Contacts from '../../Components/Contacts/Contacts';

const Home = () => {
  return (
    <div>
      <FirstHomePageBanner></FirstHomePageBanner>
      <Category></Category>
      <SubAboutSection></SubAboutSection>
      <BestProducts></BestProducts>
      <FreshAroma></FreshAroma>
      <Features></Features>
      <Contacts></Contacts>
    </div>
  );
};

export default Home;
