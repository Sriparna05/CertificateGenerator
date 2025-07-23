
from marshmallow import Schema, fields, validate

class CertificateRequestSchema(Schema):
    template_id = fields.Str(required=True)
    output_format = fields.Str(required=True, validate=validate.OneOf(["pdf", "png", "jpeg"]))
    recipients = fields.List(fields.Dict(), required=True)
    ai_options = fields.Dict(required=False)
