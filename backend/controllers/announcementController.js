import {
  createAnnouncement,
  listAuthoredAnnouncements,
  listReceivedAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead
} from "../services/announcementService.js";

export async function create(req, res, next) {
  try {
    const announcement = await createAnnouncement(
      req.user,
      req.body
    );

    return res.status(201).json({
      mensagem: "Comunicado publicado com sucesso!",
      comunicado: announcement
    });
  } catch (error) {
    next(error);
  }
}

export async function listAuthored(req, res, next) {
  try {
    const announcements = await listAuthoredAnnouncements(req.user);

    return res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
}

export async function listReceived(req, res, next) {
  try {
    const { categoria } = req.query;

    const announcements = await listReceivedAnnouncements(
      req.user,
      categoria
    );

    return res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const announcement = await updateAnnouncement(
      req.params.id,
      req.user,
      req.body
    );

    return res.status(200).json({
      mensagem: "Comunicado atualizado com sucesso!",
      comunicado: announcement
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await deleteAnnouncement(
      req.params.id,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const result = await markAnnouncementAsRead(
      req.params.id,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}