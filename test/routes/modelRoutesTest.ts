import chai from "chai";
const expect = chai.expect;
import "mocha";
import fetch from "node-fetch";

describe("Model", () => {

    // tslint:disable-next-line: prefer-const
    let webSiteId: string;
    let sessionId: string;
    let modelId: string;

    const BASE_URL = "http://localhost:5007/model/";

    before(() => {
        const url = "http://localhost:5005/website/create";
        const body = {
            name: "test",
            url:"https://www.test.test",
            mappingList: [],
        };
        const option = {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
        return fetch(url, option)
            .then(res => {
                return res.json();
            })
            .then(id => {
                webSiteId = id;
            })
    });

    it("should create a session", () => {
        const url = "http://localhost:5006/session/create";
        const body = {
            webSiteId,
            baseURL: "http://www.test.com/index.html",
        };
        const option = {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
        return fetch(url, option)
            .then((res) => {
                return res.json();
            })
            .then((createdSessionId) => {
                sessionId = createdSessionId;
            });
    });

    it("should create a new model", () => {
        const url = BASE_URL + "create";
        const body = {
            depth: 3,
            interpolationfactor: 2,
        };
        const option = {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
        return fetch(url, option)
            .then((res) => res.json())
            .then((createdModelId) => {
                modelId = createdModelId;
            });
    });

    it("should link the model to a session", () => {
        const url = BASE_URL + modelId + "/link/" + sessionId;
        const option = {
            method: "POST",
            body:    JSON.stringify({}),
            headers: { "Content-Type": "application/json" },
        };
        return fetch(url, option)
            .then((res) => res.json())
    });

    it("should add an exploration", () => {
        const url = "http://localhost:5006/session/" + sessionId + "/exploration/add";
        const body = {
            testerName: "superTester",
            interactionList: [
                {index: 0, concreteType: "Action", kind: "start"},
                {index: 1, concreteType: "Action", kind: "click", value: "value"},
                {index: 2, concreteType: "Action", kind: "click", value: "value"},
            ],
        };
        return fetch(url, {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        .then(res => res.json())
        .then( explNum => {
            expect(explNum).to.eql(0);
        });
    });
    it("should compute probability", () => {
        const url = BASE_URL + modelId + "/getprobabilitymap";

        const body = {
            testerName: "superTester",
            interactionList: [
                {index: 0, concreteType: "Action", kind: "start"},
            ],
        };
        const option = {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        };
        return fetch(url, option)
        .then((res) => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        })
        .then(probaMap => {
            // tslint:disable-next-line: no-magic-numbers
            expect(probaMap).lengthOf(1);
            expect(probaMap[0]).lengthOf(2);
            expect(probaMap[0][0]).to.eql("click$value");
            expect(probaMap[0][1]).to.eql(1);

        });
    });

    it("should add an exploration with comment", () => {
        const url = "http://localhost:5006/session/" + sessionId + "/exploration/add";
        const body = {
            testerName: "superTester",
            interactionList: [
                {index: 1, concreteType: "Action", kind: "start"},
                {index: 2, concreteType: "Action", kind: "click", value: "value"},
                {index: 3, concreteType: "Comment", kind: "bug", value: "hard"},
            ],
        };
        return fetch(url, {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        .then((res) => res.json())
        .then( (explNum) => {
            expect(explNum).to.eql(1);
        });
    });

    it("should get the distribution of the comment", () => {
        const url = BASE_URL + modelId + "/getcommentdistributions";
        const body = {
            interactionList: [
                {index: 1, concreteType: "Action", kind: "start"},
                {index: 2, concreteType: "Action", kind: "click", value: "value"},
            ],
        };
        return fetch(url, {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
            // tslint:disable-next-line: no-unused-expression
            expect(res.ok).to.be.true;
            return res.json();
        })
        .then( (commentDistributions) => {
            const commentDistributionList = commentDistributions;
            expect(commentDistributionList.length).eql(1);
            const distributionsForNote = commentDistributionList[0];
            expect(distributionsForNote.note).to.eql("bug$hard");
            expect(distributionsForNote.distributions.length).to.eql(2);

            const distribution1 = distributionsForNote.distributions[0];
            expect(distribution1.contextOccurence).to.eql(2);
            expect(distribution1.noteOccurence).to.eql(1);
            expect(distribution1.context).to.eql(["start", "click$value"]);

            const distribution2 = distributionsForNote.distributions[1];
            expect(distribution2.contextOccurence).to.eql(3);
            expect(distribution2.noteOccurence).to.eql(1);
            expect(distribution2.context).to.eql(["click$value"]);
        });
    });

    it("should get the cross entropy evolution of the model", () => {
        const url = BASE_URL + "cross_entropy_evolution";
        const body = {
            depth: 3,
            interpolationfactor: 2,
            sessionId_list: [sessionId],
        };
        return fetch(url, {
            method: "POST",
            body:    JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        }).then((response) => {
            expect(response.ok).to.eql(true);

            return response.json();
        });
    });

});
