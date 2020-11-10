import logging
import azure.functions as func
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(status_code=404)
    else:
        amount = req_body.get('money')
        tax_percentage = 0.10
        tax_money = float(amount) * tax_percentage
        return func.HttpResponse(status_code=200, body=json.dumps({"tax_money": tax_money}))
        
