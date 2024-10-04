import React, { useState } from 'react';  
import useSWR, { mutate } from 'swr';  
import { trpcAstroClient } from '../client'; // Adjust the import based on your project structure  

const GreetingComponent = () => {  
    const [name, setName] = useState('');  
    const [greeting, setGreeting] = useState('');  

    // Using SWR to fetch a default greeting message  
    const { data, error } = useSWR('greeting', () => trpcAstroClient.greeting.query());  

    // Handle button click to send the mutation  
    const handleGreet = async () => {  
        const response = await trpcAstroClient.greetWithName.mutate(name);  
        setGreeting(response.message); // Set the message returned from the server  
        // Optionally, you can use `mutate` to revalidate any relevant SWR keys here.  
    };  

    if (error) return <div>Error loading greeting.</div>;  
    if (!data) return <div>Loading...</div>;  

    return (  
        <div>  
            <div id="greetingDiv">  
                {data.bye} {/* Displaying the default greeting */}  
            </div>  
            <input   
                type="text"   
                value={name}   
                onChange={(e) => setName(e.target.value)}   
                placeholder="Enter your name"   
            />  
            <button onClick={handleGreet}>Greet Me!</button>  
            {greeting && <div>{greeting}</div>} {/* Displaying the greeting response */}  
        </div>  
    );  
};  

export default GreetingComponent;  