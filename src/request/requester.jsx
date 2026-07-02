// @ts-check
const DEFAULT_SERVER_DOMAIN = "https://scholarstavernserver.onrender.com"

class ResponseData {
    status = 0
    success = false
    message = ""
    data = {}

    constructor(status, success, message, data){
        this.status = status
        this.success = success
        this.message = message
        this.data = data
    }
}

/** 
    * @param {Object} options
    * @param {string} options.domain
    * @param {string} options.endpoint
    * @param {Record<string, any>} options.request_params
    * @param {(_: ResponseData) => void} options.on_finish
    * @param {(_: any) => void} options.on_error
*/
export function GET({
    domain=DEFAULT_SERVER_DOMAIN,
    endpoint="",
    request_params={},
    on_finish=(/** @type {ResponseData} */ _) => {},
    on_error=(/** @type {any} */ _) => {}
}) {
    console.log("executed GET")
    fetch(domain+endpoint+"?"+new URLSearchParams(request_params), 
        { 
            method: "GET",
            credentials: "include",
        }).then(async (response) => {
            console.log("sent get request!")
            let body = await response.json()
            if (!body){
                on_finish(new ResponseData())
                return
            }
            let status = response.status
            let success = body.success
            let message = body.message
            let data = body.data
            on_finish(new ResponseData(status, success, message, data))
        }).catch((reason) => {
            console.log(reason)
            on_error(reason)
        })
}

/** 
    * @param {Object} options
    * @param {string} options.domain
    * @param {string} options.endpoint
    * @param {string | Map} options.body
    * @param {Record<string, any>} options.request_params
    * @param {string} options.content_type
    * @param {(_: ResponseData) => void} options.on_finish
    * @param {(_: Error) => void} options.on_error
*/
export async function POST({
    domain=DEFAULT_SERVER_DOMAIN,
    endpoint="",
    body="",
    request_params={},
    content_type="application/json",
    on_finish=(_) => {},
    on_error=(error) => {console.log(error)}
}) {
    let body_final = body
    if (typeof body_final !== "string")
        body_final = JSON.stringify(body_final)

    fetch(domain+endpoint+"?"+new URLSearchParams(request_params), 
        { 
            method: "POST",
            body: body_final,
            credentials: "include",
            headers: { 
                "Content-Type": content_type
            }
        }).then(async (response) => {
            let body
            let content_type = response.headers.get("content-type")
            console.log(content_type)
            if (content_type === "application/json")
                body = await response.json()
            else {
                body = await response.text()

                on_finish(new ResponseData(
                    response.status,
                    true,
                    "",
                    body
                ))
                return
            }

            let status = response.status
            let success = body.success
            let message = body.message
            let data = body.data
            on_finish(new ResponseData(status, success, message, data))

        }).catch((/** @type {Error} */ response) => {
            on_error(response)
        })
}

export async function checkAuth({
    domain=DEFAULT_SERVER_DOMAIN,
}) {
    console.log("executed GET")
    const response = await fetch(domain+"/auth", 
        { 
            method: "GET",
            credentials: "include",
        })
    const result = await response.json()
    return result;
}
