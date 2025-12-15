import React from 'react';
import './Count.css';

const Count = () => {
    return (
        <div>
            <div className=" w-100 mx-auto text-white count-style">
                <div className="row w-100 mx-auto py-2">
                    <div className="col text-center">
                        <h3><i className="fas fa-users"></i></h3>
                        <h3 className="counter">150</h3>
                        <h4>Clients</h4>

                    </div>
                    <div className="col text-center">
                        <h3><i className="fas fa-file"></i></h3>
                        <h3 className="counter">230</h3>
                        <h4>Projects</h4>

                    </div>
                    <div className="col text-center">
                        <h3><i className="fas fa-solid fa-user-plus"></i></h3>
                        <h3 className="counter">6</h3>
                        <h4>Experts</h4>
                    </div>
                    <div className="col text-center">
                        <h3><i className="fas fa-solid fa-building"></i></h3>
                        <h3 className="counter">4</h3>
                        <h4>Collaboration with  Companies</h4>

                    </div>
                </div>
            </div>

        </div>
    );
};

export default Count;