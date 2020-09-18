import { parse, traverse } from "@babel/core";
import { VisitNodeFunction } from "@babel/traverse";
import { JSXOpeningElement, Node } from "@babel/types";
import { getAttributeValues } from "..";

const options = {
    filename: "foo.js",
    presets: ["@babel/preset-react"],
};

function visit(
    jsx: string,
    visitor: VisitNodeFunction<Node, JSXOpeningElement>
) {
    const ast = parse(jsx, options);
    traverse(ast, {
        JSXOpeningElement: visitor,
    });
}

describe("JSX attribute utils", () => {
    it("parses a string literal", () => {
        visit(`<Foo bar="hello" />`, (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual("hello");
        });
    });

    it("parses a numeric literal", () => {
        visit(`<Foo bar={1} />`, (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual(1);
        });
    });

    it("parses an array", () => {
        visit(`<Foo bar={[1,2,3]} />`, (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual([1, 2, 3]);
        });
    });

    it("parses an object", () => {
        visit(`<Foo bar={{hello: "World"}} />`, (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual({ hello: "World" });
        });
    });

    it("resolves a template literal", () => {
        visit("<Foo bar={`hello`} />", (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual(`hello`);
        });
    });

    it("resolves a template literal with placeholder", () => {
        visit("<Foo bar={`hello ${'world'}`} />", (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual(`hello world`);
        });
    });

    it("resolves an expression", () => {
        visit("<Foo bar={1 + 2} />", (nodePath) => {
            const values = getAttributeValues(nodePath);
            expect(values.bar).toEqual(3);
        });
    });

    it("resolves a local variable", () => {
        visit(
            `
        const myVar = 1;
        <Foo bar={myVar} />;
        `,
            (nodePath) => {
                const values = getAttributeValues(nodePath);
                expect(values.bar).toEqual(1);
            }
        );
    });

    it("resolves a local variable with expression", () => {
        visit(
            `
        const myVar = 1 + 1;
        <Foo bar={myVar} />;
        `,
            (nodePath) => {
                const values = getAttributeValues(nodePath);
                expect(values.bar).toEqual(2);
            }
        );
    });

    it("resolves a spread object", () => {
        visit(
            `
        const attributes = {
            bar: 4
        };
        <Foo {...attributes} />;
        `,
            (nodePath) => {
                const values = getAttributeValues(nodePath);
                expect(values.bar).toEqual(4);
            }
        );
    });

    it("excludes a value if it is not in the includes list", () => {
        visit(`<Foo bar="hello" />`, (nodePath) => {
            const values = getAttributeValues(
                nodePath,
                undefined,
                new Set(["includeMe"])
            );
            expect(values.bar).toBeUndefined();
        });
    });

    it("reports an error for an unresolvable value", () => {
        visit(`<Foo bar={invalid} />`, (nodePath) => {
            const onError = jest.fn();
            const values = getAttributeValues(nodePath, onError);
            expect(values.bar).toBeUndefined();
            expect(onError).toHaveBeenCalledWith("bar");
        });
    });

    it("reports an error for an unresolvable value if it is in the includes list", () => {
        visit(`<Foo bar={invalid} />`, (nodePath) => {
            const onError = jest.fn();
            const values = getAttributeValues(
                nodePath,
                onError,
                new Set(["bar"])
            );
            expect(values.bar).toBeUndefined();
            expect(onError).toHaveBeenCalledWith("bar");
        });
    });

    it("does not report an error for an unresolvable value that isn't in the includes list", () => {
        visit(`<Foo bar={invalid} />`, (nodePath) => {
            const onError = jest.fn();
            const values = getAttributeValues(
                nodePath,
                onError,
                new Set(["includeMe"])
            );
            expect(values.bar).toBeUndefined();
            expect(onError).not.toHaveBeenCalled();
        });
    });
});
