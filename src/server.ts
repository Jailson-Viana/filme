import express from 'express';
import { PrismaClient } from '@prisma/client';

const port = 3000;
const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.get('/movies', async (_, res) => {
   const movies = await prisma.movie.findMany({
      orderBy: {
         title: 'asc',
      },
      include: {
         genres: true,
         languages: true,
      },
   });
   res.json(movies);
});

app.put('/movies/:id', async (req, res) => {
   //pegar o id do registro que será atualizado
   const id = Number(req.params.id);
   try {
      const movie = await prisma.movie.findUnique({
         where: { id },
      });

      if (!movie) {
         return res.status(404).send({ message: 'Filme não encontrado!' });
      }
      const data = { ...req.body };
      data.release_date = data.release_date ? new Date(data.release_date) : undefined;

      //pegar os dados do filme que será atualizado e atualizar ele no prisma
      await prisma.movie.update({
         where: {
            id,
         },
         data: data,
      });
   } catch (error) {
      return res.status(500).send({ message: 'Falha ao atualizar o resgitro do filme!' });
   }

   //retornar o status correto informando que o filme foi atualizado
   res.status(200).send();
});

app.post('/movies', async (req, res) => {
   const { title, genre_id, language_id, oscar_count, release_date } = req.body;
   try {
      /*case insensitive - se a busca for feita por john wick ou John wick ou JOHN WICK, 
      o registro vai ser retornado na consulta.*/

      /*case sensitive - se buscar for jhon wick e no banco estiver com Jhon wick, não vai ser retornado na consulta*/

      const movieWithSameTitle = await prisma.movie.findFirst({
         where: { title: { equals: title, mode: 'insensitive' } },
      });

      if (movieWithSameTitle) {
         return res.status(409).send({ message: 'Já existe um filme cadastrado com esse títilo' });
      }
      await prisma.movie.create({
         data: {
            title,
            genre_id,
            language_id,
            oscar_count,
            // cuidado aqui, o mes começa em 0 e vai até 11
            release_date: new Date(release_date),
         },
      });
   } catch (erro) {
      return res.status(500).send({ message: 'Falha ao cadastrar um filme' });
   }
   res.status(201).send();
});

app.listen(port, () => {
   console.log(`servidor em execução na porta: ${port}`);
});
