import React from 'react';
import classes from './css/App.module.css';

//Assets
import logo from './assets/arcane3.png';

//Components
import InputForm from './components/InputForm';

function App() {
    return (
        <div className={classes.container}>
            <img className={classes.logo} src={logo} />
            <div className={classes.formDiv}>
                <InputForm />
            </div>
            
        </div>
    );
};

export default App;