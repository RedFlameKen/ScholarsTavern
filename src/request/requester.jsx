// @ts-check
const DEFAULT_SERVER_DOMAIN = "https://thinkpad-x230.taila38b71.ts.net"

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
            /** @type {Map} */
            console.log("sent get request!")
            let body = await response.json()
            if (!body){
                on_finish(new ResponseData())
                return
            }
            let status = body.get("status")
            let success = body.get("success")
            let message = body.get("message")
            let data = body.get("data")
            on_finish(new ResponseData(status, success, message, data))
        }).catch((reason) => {
            console.log(reason)
            on_error(reason)
        })
}

export async function POST({
    domain=DEFAULT_SERVER_DOMAIN,
    endpoint="",
    body="",
    request_params={},
    content_type="application/json",
    on_finish=(/** @type {ResponseData} */ _) => {},
    on_error=(/** @type {any} */ _) => {}
}) {
    fetch(domain+endpoint+"?"+new URLSearchParams(request_params), 
        { 
            method: "POST",
            body: body,
            credentials: "include",
            headers: { 
                "Content-Type": content_type
            }
        }).then(async (response) => {
            /** @type {Map} */
            let body = await response.json()
            if (!body){
                on_finish(new ResponseData())
                return
            }
            let status = body.get("status")
            let success = body.get("success")
            let message = body.get("message")
            let data = body.get("data")
            on_finish(new ResponseData(status, success, message, data))

        }).catch((response) => {
            on_error(response)
        })
}
