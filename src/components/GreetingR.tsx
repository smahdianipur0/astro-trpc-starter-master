import React, { useState } from 'react';  
import useSWR from 'swr';  
import { trpcAstroClient } from '../client'; 

const GreetingComponent = () => {  
    const [name, setName] = useState('');  
    const [greeting, setGreeting] = useState('');  
    const { data, error } = useSWR('greeting', () => trpcAstroClient.greeting.query());  



    const handleGreet = async () => {  
        try {  
            const response = await trpcAstroClient.greetWithName.mutate(name);  
            setGreeting(response.message); 
            setName('');  
        } catch (err) {  
            console.error("Error during mutation:", err);  
            setGreeting("An error occurred during greeting.");  
        }  
    };  

    if (error) return <div>Error loading greeting.</div>;  
    if (!data) return <div>Loading...</div>;  

    return (  
        <div>  
            <div id="greetingDiv">  
                {data.bye}  
            </div>  
            <input   
                type="text"   
                value={name}   
                onChange={(e) => setName(e.target.value)}   
                placeholder="Enter your name"   
            />  
            <button onClick={handleGreet}>Greet Me!</button>  
            <div>{greeting}</div> 
        </div>  
    );  
};  

export default GreetingComponent;  