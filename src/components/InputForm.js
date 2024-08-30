import React, { useState} from 'react';
import classes from '../css/InputForm.module.css';

const InputForm = () => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isRendering, setIsRendering] = useState(false);

    const handleSettings = async (e) => {
        e.preventDefault();
        window.api.send('newConfig');
    }

    async function ApparateVideo(e) {
        e.preventDefault();
        setError(null);
        setIsRendering(true);
        let validate = validateUrl(url);
        let success = validate ? await window.api.send('apparate', {url: url, fileName: fileName}) : 1;
        //let success = validate ? await Apparate({url: url, fileName: fileName}) : 1;
        
        if (success !== 0) {
            setError(success.message);
        }
        if (!validate) {{
            setError('Invalid URL');
        }}
        setUrl('');
        setFileName('');
        setIsRendering(false);
    }

    const validateUrl = (u) => {
        if (u == null) return false;
        let valid = u.search('youtube');
        if (valid !== -1) return true;
        else return false;
    }

    return (
        <div className={classes.container}>
            <p className={classes.header}>Apparate the spiritsong from beyond</p>
            <form className={classes.formDiv}>
                <input
                    className={classes.linkInput}
                    type='text'
                    placeholder='Dimentio link...'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <input
                    className={classes.linkInput}
                    type='text'
                    placeholder='File name...'
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />
                <div className={classes.actionButtons}>
                    {isRendering ? <button className={classes.buttons} type='submit' onClick={ApparateVideo} disabled>Apparate</button> : <button className={classes.buttons} type='submit' onClick={ApparateVideo}>Apparate</button>}
                    {isRendering ? <button className={classes.buttons} onClick={handleSettings} disabled>Settings</button> : <button className={classes.buttons} onClick={handleSettings}>Settings</button>}
                </div>
            </form>
            <div className={classes.errorDiv}>
            {error && <p className={classes.errorMsg}>{error}</p>}
            </div>
        </div>
    );
};

export default InputForm;