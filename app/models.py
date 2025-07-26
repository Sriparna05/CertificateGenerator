
from marshmallow import Schema, fields, validate, post_load
from datetime import datetime

class RecipientSchema(Schema):
    name = fields.Str(required=True)
    guardian_name = fields.Str(required=False, allow_none=True)
    stream = fields.Str(required=False, allow_none=True)
    school_college = fields.Str(required=False, allow_none=True)
    publish_date = fields.Date(required=False, allow_none=True, format="%Y-%m-%d")
    duration = fields.Str(required=False, allow_none=True)
    organization = fields.Str(required=False, allow_none=True)
    completion_date = fields.Date(required=False, allow_none=True, format="%Y-%m-%d")

    @post_load
    def convert_dates_to_str(self, data, **kwargs):
        if 'publish_date' in data and isinstance(data['publish_date'], datetime):
            data['publish_date'] = data['publish_date'].strftime("%Y-%m-%d")
        if 'completion_date' in data and isinstance(data['completion_date'], datetime):
            data['completion_date'] = data['completion_date'].strftime("%Y-%m-%d")
        return data

class CertificateRequestSchema(Schema):
    template_id = fields.Str(required=True)
    output_format = fields.Str(required=True, validate=validate.OneOf(["pdf", "html", "png", "jpeg"]))
    recipients = fields.List(fields.Nested(RecipientSchema), required=True)
    ai_options = fields.Dict(required=False)
