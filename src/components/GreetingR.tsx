import React, { useState } from "react";
import useSWR from "swr";
import { trpcAstroClient } from "../client";

const GreetingComponent = () => {
    const [name, setName] = useState("");
    const [greeting, setGreeting] = useState("");
    const [isLoading, setIsLoading] = useState(false); // New loading state
    const { data, error } = useSWR("greeting", () =>
        trpcAstroClient.greeting.query(),
    );

    const handleGreet = async () => {
        setIsLoading(true);
        try {
            const response = await trpcAstroClient.greetWithName.mutate(name);
            setGreeting(response.message);
            setName("");
        } catch (err) {
            console.error("Error during mutation:", err);
            setGreeting("An error occurred during greeting.");
        } finally {
            setIsLoading(false);
        }
    };

    if (error) return <div>Error loading greeting.</div>;
    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <div> {data.bye} </div>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
            />
            <button onClick={handleGreet} disabled={isLoading || name === ""}>
                {isLoading ? "Greeting..." : "Greet Me!"}
            </button>
            <div> {isLoading ? "Greeting..." : greeting} </div>
        </div>
    );
};

export default GreetingComponent;