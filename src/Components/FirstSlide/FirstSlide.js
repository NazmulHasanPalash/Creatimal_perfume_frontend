import React from 'react';
import './FirstSlide.css';

const FirstSlide = () => {
    return (
        <div>
            <div className="row row-cols-1 row-cols-md-3 g-4 mx-5 my-2 w-100 mx-auto">
                <div className="col">
                    <div className="card info-img">
                        <img src="image/Gallery/Leonardo_Diffusion_luxury_beauty_products_mockup_0.jpg" alt="" />
                        <div className="card-body">
                            <h5 className="card-title">  Luxury Beauty Products Mockup</h5>

                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card info-img">
                        <img src="image/Gallery/Leonardo_Diffusion_luxury_visiting_card_mockup_0.jpg" alt="" />
                        <div className="card-body">
                            <h5 className="card-title">Luxury Visiting Card Mockup</h5>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card info-img">
                        <img src="image/Gallery/Leonardo_Diffusion_luxury_perfume_mockup_0.jpg" className="card-img-top" alt="..." />
                        <div className="card-body">
                            <h5 className="card-title">Luxury Perfume Product Mockup  </h5>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default FirstSlide;