import React, { useState } from "react";  
import { trpcAstroClient } from "../client";  

const defaultGreeting = "Hello, World!";   

const GreetingComponent = () => { 

    const [name, setName] = useState("");  
    const [isLoading, setIsLoading] = useState(false); 
    const [greeting, setGreeting] = useState(""); 

    const handleGreet = async () => {
        setIsLoading(true);
        try {
            const response = await trpcAstroClient.greetWithName.mutate({ names: name }); 
            setGreeting(response.message); 
            setName("");
        } catch (err) {
            console.error("Error during mutation:", err);
            setGreeting("An error occurred during greeting.");
        } finally {
            setIsLoading(false);
        }
    };

    return (  
        <div>  
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
            />
           <button onClick={handleGreet} disabled={isLoading || name === ""}>
                {isLoading ? "Greeting..." : "Greet Me!"}
            </button>

            <div> {greeting} </div>
        </div>  
    );  
};  

export default GreetingComponent; 