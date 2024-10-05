import React, { useState } from "react";
import useSWR from "swr";
import { trpcAstroClient } from "../client";

const GreetingComponent = () => {
    const { data, error } = useSWR("greetingr", () =>
        trpcAstroClient.greeting.query(),
    );



    if (error) return <div>Error loading greeting.</div>;
    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <div> {data.bye} </div>
        </div>
    );
};

export default GreetingComponent;
