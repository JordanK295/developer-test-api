import express, { Application, Request, Response } from "express";

import Routes from "./routes";
import errorHandling from "./shared/errorHandling";
import middleware from "./shared/middleware";
import fetch from "node-fetch";

// Create an Express instance
const app: Application = express();

// express app
app.use(express.json());

app.post("/credit-search", (req: Request, res: Response) => {
	let address1;
	let address2;
	const postcode = req.body.postcode;
	const surname = req.body.surname;

	// Creating two address lines for flats

	if (req.body.address.toLowerCase().includes("flat")) {
		const words = req.body.address.split(" ");
		address1 = words[0] + " " + words[1];
		address2 = words.slice(2).join(" ");
	} else {
		address1 = req.body.address;
		address2 = "";
	}

    // Call for the address data

	const addressBody = {
		address1: address1,
		address2: address2,
		postcode: postcode,
	};

	const addressPost = {
		method: "POST",
		body: JSON.stringify(addressBody),
		headers: { "Content-Type": "application/json" },
	};

	fetch(
		"https://developer-test-service-2vfxwolfiq-nw.a.run.app/addresses",
		addressPost
	)
		.then((res) => res.json())
		.then((addressData) => {
			const addressId = addressData[0].id;

            // Now we have the address ID, we can call for the creditors data

			const creditorsBody = {
				surname: surname,
				addressId: addressId,
			};

			const creditorsPost = {
				method: "POST",
				body: JSON.stringify(creditorsBody),
				headers: { "Content-Type": "application/json" },
			};

			fetch(
				"https://developer-test-service-2vfxwolfiq-nw.a.run.app/creditors",
				creditorsPost
			)
				.then((res) => res.json())
				.then((creditorsData) => {
					let totalCreditorValue = 0;
					let securedCreditorValue = 0;
					let unsecuredCreditorValue = 0;
					let qualificationCheck = 0;
					let qualifies = false;

                    // Summing the creditors value and checking if the individual qualifies

					creditorsData.forEach((creditor) => {
						totalCreditorValue += creditor.value;
						if (creditor.secured) {
							securedCreditorValue += creditor.value;
						} else {
							unsecuredCreditorValue += creditor.value;
							qualificationCheck++;
						}
					});

					if (qualificationCheck > 1 && unsecuredCreditorValue >= 500000) {
						qualifies = true;
					}

                    // Returning the response

					const creditSearchResponse = {
						totalCreditorValue: totalCreditorValue,
						securedCreditorValue: securedCreditorValue,
						unsecuredCreditorValue: unsecuredCreditorValue,
						qualifies: qualifies,
					};

					res.send(creditSearchResponse);
				})

				.catch((error) => console.log("Creditors ERROR", error));
		})

		.catch((error) => console.log("Address ERROR", error));
});

// Add any middleware
middleware(app);

// Set up appropriate routes
Routes(app);

// Add any error handling
errorHandling(app);

export default app;
