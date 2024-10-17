import { useState } from "react";
import { trpcAstroClient } from "../client";
import useSWRMutation from "swr/mutation";
import { UAParser } from "ua-parser-js";

const fetchIP = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
};

const IDComponent = () => {
    const {
        trigger: triggerFetchIP,
        data: IPAddress,
        error: IPError,
        isMutating: isGettingIP,
    } = useSWRMutation("http://ip-api.com/json/", fetchIP);

    const handleButtonClick = async () => {
        const fetchedIP = await triggerFetchIP();

        if (IPError) {
            return "Error loading IP address";
        }

        const resolution = window.screen.width.toString();
        const { browser, os } = UAParser(navigator.userAgent);
        const dash = "-";
        const generatedUserIDo = `${browser.name}${dash}${os.version}${dash}${resolution}${dash}${fetchedIP.query}`;

        function replaceDotsWithDashes(input) {  
            return input.replace(/\./g, '-');  
        }

        const generatedUserID = replaceDotsWithDashes(generatedUserIDo); 

        const response = await trpcAstroClient.addUser.mutate({
            id: generatedUserID,
        });
        return response;
    };

    const { data, error, trigger, isMutating } = useSWRMutation(
        "check id",
        handleButtonClick,
    );

    return (
        <div>
            <button disabled={isMutating}
                onClick={async () => {
                    await trigger();
                }}> What's my ID?
            </button>
            {error && <div>Error loading greeting.</div>}
            {isMutating && <div>Loading...</div>}
            {!isMutating && data && <div>{data.message}</div>}
        </div>
    );
};

export default IDComponent;