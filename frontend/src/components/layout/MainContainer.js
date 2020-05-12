import React from 'react';

export const MainContainer = props =>{
    return (
        <header className="background rgba-black-strong">
            <div className="main-container">
                <div className="container">
                    { props.children }
                </div>
            </div>
        </header>
    )
}