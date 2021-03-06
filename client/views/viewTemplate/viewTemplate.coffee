Helpers = {
  updateTemplateInfo: (templateId, templateName, templateDescription, activeStatus) -> 
    Meteor.call('updateTemplateInfo', templateId, templateName, templateDescription, activeStatus, (error, result) -> (
      if error
          console.log(JSON.stringify(error,null,2))
          ga('send', 'event', 'TEMPLATE_UPDATE', 'failed')
      else
          console.log(result)
          ga('send', 'event', 'TEMPLATE_UPDATE', 'update_template_info')
          Session.set("isEditingTemplateInfo", false)
    ))
}


Template['viewTemplate'].onRendered -> (
  # initialize checkboxes
  $('.ui.checkbox')
    .checkbox()

  $('#renameHelp')
    .popup()

  $('#sharingHelp')
    .popup()

)


Template['viewTemplate'].helpers(
  isOwnerAndShared: ->
    isOwner = this.template.owner == Meteor.userId()
    isShared = this.template.sharing.shared
    isOwner && isShared

  isOwner: ->
    this.template.owner == Meteor.userId()

  isEditingTemplateInfo: ->
    Session.get("isEditingTemplateInfo")

)


Template['viewTemplate'].events(
  'click #updateTemplateInfoEdit': () ->
    Session.set("isEditingTemplateInfo", true)
    return false

  'click #updateTemplateInfoCancel': () ->
    Session.set("isEditingTemplateInfo", false)
    return false

  'click #updateTemplateInfoSave': (evt, tpl) ->
    evt.preventDefault()
    console.log("Form: " + evt.type);
    templateId = Router.current().params._id
    templateName = $('input[name="templateName"]').val()
    templateDescription = $('textarea[name="templateDescription"]').val()
    activeStatus = $('input[name="templateActive"]').prop("checked")
    
    Helpers.updateTemplateInfo(templateId, templateName, templateDescription, activeStatus)
      
    console.log("Called addTemplate method: " + templateName);
)