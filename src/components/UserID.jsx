import React from "react";  
import useSWR from "swr";  
import {UAParser} from 'ua-parser-js'


const resolution = window.screen.width.toString();
const { browser, cpu, device, os } = UAParser(navigator.userAgent);
const dash = "-"

  
const fetcher = (url) => fetch(url).then((response) => response.json());  



const GreetingComponent = () => {  
    const { data, error } = useSWR('http://ip-api.com/json/', fetcher);


    if (error) return <div>Error loading IP address.</div>;  
    if (!data) return <div>Loading...</div>;  
    const userID = browser.name.concat(dash, os.version, dash, resolution, dash,data.query.toString());  
    return (  
        <div> 
            <div>{userID}</div>  
        </div>  
    );  
};  

export default GreetingComponent;