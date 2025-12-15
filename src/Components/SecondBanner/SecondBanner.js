import React, { useEffect, useState } from 'react';
import Typist from 'react-typist';
import Banner from '../Banner/Banner';
import './SecondBanner.css';


const SecondBanner = () => {

    const [count, setCount] = useState(1);

    useEffect(() => {
        // document.title = `You clicked ${count} times`;
        console.log("Count: " + count);
        setCount(1);
    }, [count]);
    return (

        <div className="second-banner-style">


            <div className="container w-100 mx-auto  " id="particles-js">

                <div className="row  align-items-center py-3">
                    <div className=" col-lg-6 col-sm-12 col-md-6">
                        <div className="banner-text-style">
                            <div className="m-5 body-dtyle">
                                <h5 className="card-title tag-style">Welcome to OJH</h5>
                                <h1 className="card-title">Top Tax Advisory and Accounting Firm in Malaysia & Singapore </h1>
                                <h3>working for
                                    {count ? (
                                        <Typist avgTypingDelay={50} onTypingDone={() => setCount(0)}>
                                            <span className="type-style"> accounting</span>
                                            <Typist.Backspace count={50} delay={800} />
                                            <span className="type-style"> taxation</span>
                                            <Typist.Backspace count={50} delay={800} />
                                            <span className="type-style"> business advisory</span>
                                            <Typist.Backspace count={50} delay={800} />
                                            <span className="type-style"> corporate advisory services</span>
                                        </Typist>
                                    ) : (
                                        ""
                                    )}
                                </h3>
                                <p className='second_banner_paragraph'>OJH Consulting Sdn Bhd is a leading professional services firm in Malaysia established in 2024 and committed to helping businesses grow smarter and succeed faster. We provide a full range of expert solutions including tax advisory, audit and assurance, business consulting, corporate secretarial services, and HRDC claimable corporate training. Our team works closely with startups, SMEs, and growing companies to deliver powerful strategies that improve performance, ensure compliance, and unlock new opportunities. At OJH Consulting, we focus on real results, helping you build a stronger business that is ready to lead in a fast moving and competitive market.</p>
                                <button className="btn  btn-style my-3  contact-style"><a className="mx-5" href="#contact">Contact
                                </a></button>

                            </div>


                        </div>
                    </div>
                    <div className=" col-lg-6 col-sm-12 col-md-6">
                        <Banner></Banner>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default SecondBanner;